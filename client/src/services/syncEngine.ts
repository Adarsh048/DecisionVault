import { db, type OutboxItem } from '@/lib/db';
import { useSyncStore } from '@/store/syncStore';
import { useDecisionStore, INITIAL_DECISIONS } from '@/store/decisionStore';

class SyncEngine {
  private isProcessing = false;
  private isInitialized = false;

  /**
   * Initializes network event listeners, hydrates local IndexedDB vault,
   * and starts initial sync if online.
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // 1. Listen for browser network events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleNetworkChange(true));
      window.addEventListener('offline', () => this.handleNetworkChange(false));
    }

    // 2. Ensure initial seed in IndexedDB
    await this.ensureSeedData();

    // 3. Hydrate Zustand decision store from IndexedDB
    await this.hydrateFromIndexedDB();

    // 4. Update initial sync status and stats
    await this.refreshStats();

    const isOnline = this.isEffectivelyOnline();
    if (isOnline) {
      await this.processOutbox();
    } else {
      useSyncStore.getState().setStatus('offline');
      useSyncStore.getState().setOnline(false);
    }
  }

  /**
   * Checks whether the app is currently connected and not in simulated offline mode.
   */
  isEffectivelyOnline(): boolean {
    const { isSimulatedOffline } = useSyncStore.getState();
    if (isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Handle physical network status changes
   */
  private async handleNetworkChange(online: boolean) {
    const { isSimulatedOffline } = useSyncStore.getState();
    if (isSimulatedOffline) {
      // User explicitly wants offline simulation
      return;
    }

    useSyncStore.getState().setOnline(online);

    if (online) {
      useSyncStore.getState().setStatus('syncing');
      await this.processOutbox();
    } else {
      useSyncStore.getState().setStatus('offline');
    }
  }

  /**
   * Toggle or set simulated offline mode (ideal for offline-first testing & demonstrations)
   */
  async setSimulatedOffline(simulated: boolean): Promise<void> {
    useSyncStore.getState().setSimulatedOffline(simulated);
    useSyncStore.getState().setOnline(!simulated && (typeof navigator !== 'undefined' ? navigator.onLine : true));

    if (simulated) {
      useSyncStore.getState().setStatus('offline');
    } else {
      const physicallyOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (physicallyOnline) {
        useSyncStore.getState().setStatus('syncing');
        await this.processOutbox();
      } else {
        useSyncStore.getState().setStatus('offline');
      }
    }
    await this.refreshStats();
  }

  /**
   * Enqueues an operation to the local IndexedDB Outbox table.
   * If online, immediately triggers outbox flushing.
   */
  async enqueue(type: OutboxItem['type'], payload: any): Promise<void> {
    const outboxItem: OutboxItem = {
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: 'pending',
    };

    await db.outbox.put(outboxItem);
    await this.refreshStats();

    if (this.isEffectivelyOnline()) {
      // Process asynchronously
      setTimeout(() => {
        this.processOutbox().catch(console.error);
      }, 50);
    } else {
      useSyncStore.getState().setStatus('offline');
    }
  }

  /**
   * Process all pending operations in the outbox
   */
  async processOutbox(): Promise<void> {
    if (this.isProcessing) return;
    if (!this.isEffectivelyOnline()) {
      useSyncStore.getState().setStatus('offline');
      return;
    }

    const pendingItems = await db.outbox.orderBy('createdAt').toArray();
    if (pendingItems.length === 0) {
      useSyncStore.getState().setStatus('synced');
      useSyncStore.getState().setPendingCount(0);
      return;
    }

    this.isProcessing = true;
    useSyncStore.getState().setStatus('syncing');
    useSyncStore.getState().setPendingCount(pendingItems.length);

    try {
      for (const item of pendingItems) {
        // Simulate realistic network roundtrip / server reconciliation
        await new Promise((resolve) => setTimeout(resolve, 350));

        // Mark associated record as synced in local IndexedDB
        if (item.type === 'create_decision' && item.payload?.id) {
          await db.decisions.update(item.payload.id, { synced: true });
        }

        // Remove item from outbox once acknowledged
        await db.outbox.delete(item.id);

        const remaining = await db.outbox.count();
        useSyncStore.getState().setPendingCount(remaining);
      }

      useSyncStore.getState().setStatus('synced');
      useSyncStore.getState().setLastSyncedAt(new Date());
      useSyncStore.getState().setPendingCount(0);
    } catch (err) {
      console.error('[SyncEngine] Error flushing outbox:', err);
      useSyncStore.getState().setStatus('error');
    } finally {
      this.isProcessing = false;
      await this.refreshStats();
    }
  }

  /**
   * Seeds initial architectural decision records into IndexedDB if empty
   */
  private async ensureSeedData(): Promise<void> {
    try {
      const count = await db.decisions.count();
      if (count === 0) {
        // Populate IndexedDB with initial decisions
        await db.decisions.bulkPut(
          INITIAL_DECISIONS.map((d) => ({
            ...d,
            synced: true,
          }))
        );
      }
    } catch (err) {
      console.warn('[SyncEngine] Error ensuring seed data:', err);
    }
  }

  /**
   * Hydrates the Zustand memory store from IndexedDB
   */
  async hydrateFromIndexedDB(): Promise<void> {
    try {
      const records = await db.decisions.orderBy('number').reverse().toArray();
      if (records.length > 0) {
        useDecisionStore.setState({ decisions: records });
      }
    } catch (err) {
      console.warn('[SyncEngine] Error hydrating from IndexedDB:', err);
    }
  }

  /**
   * Recalculates storage stats and sync counts
   */
  async refreshStats(): Promise<void> {
    try {
      const decisionCount = await db.decisions.count();
      const outboxCount = await db.outbox.count();
      const draftCount = await db.drafts.count();

      useSyncStore.getState().setPendingCount(outboxCount);
      useSyncStore.getState().setStorageStats({
        decisionCount,
        outboxCount,
        draftCount,
        dbName: 'DecisionVaultDB (IndexedDB)',
      });
    } catch (err) {
      console.warn('[SyncEngine] Error refreshing stats:', err);
    }
  }

  /**
   * Reset local database to default seed state (for testing & verification)
   */
  async resetAndReseed(): Promise<void> {
    await db.decisions.clear();
    await db.outbox.clear();
    await db.drafts.clear();

    await db.decisions.bulkPut(
      INITIAL_DECISIONS.map((d) => ({
        ...d,
        synced: true,
      }))
    );

    await this.hydrateFromIndexedDB();
    await this.refreshStats();
    useSyncStore.getState().setStatus('synced');
    useSyncStore.getState().setLastSyncedAt(new Date());
  }
}

export const syncEngine = new SyncEngine();
