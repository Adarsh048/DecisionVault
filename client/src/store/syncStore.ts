import { create } from 'zustand';
import type { SyncStatus } from '@/lib/constants';

export interface StorageStats {
  decisionCount: number;
  outboxCount: number;
  draftCount: number;
  dbName: string;
}

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: Date | null;
  isOnline: boolean;
  isSimulatedOffline: boolean;
  storageStats: StorageStats;

  // Actions
  setStatus: (status: SyncStatus) => void;
  setPendingCount: (count: number) => void;
  setLastSyncedAt: (date: Date) => void;
  setOnline: (online: boolean) => void;
  setSimulatedOffline: (simulated: boolean) => void;
  setStorageStats: (stats: StorageStats) => void;
}

/**
 * Sync store tracks the live synchronization and network status for offline-first operations.
 */
export const useSyncStore = create<SyncState>()((set) => ({
  status: 'synced',
  pendingCount: 0,
  lastSyncedAt: new Date(),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSimulatedOffline: false,
  storageStats: {
    decisionCount: 5,
    outboxCount: 0,
    draftCount: 0,
    dbName: 'DecisionVaultDB (IndexedDB)',
  },

  setStatus: (status) => set({ status }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setOnline: (isOnline) => set({ isOnline }),
  setSimulatedOffline: (isSimulatedOffline) => set({ isSimulatedOffline }),
  setStorageStats: (storageStats) => set({ storageStats }),
}));
