import { create } from 'zustand';
import type { SyncStatus } from '@/lib/constants';

interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: Date | null;
  isOnline: boolean;

  // Actions
  setStatus: (status: SyncStatus) => void;
  setPendingCount: (count: number) => void;
  setLastSyncedAt: (date: Date) => void;
  setOnline: (online: boolean) => void;
}

/**
 * Sync store tracks the synchronization status for the offline-first architecture.
 * This is NOT persisted — it reflects the live state of the sync engine.
 */
export const useSyncStore = create<SyncState>()((set) => ({
  status: 'synced',
  pendingCount: 0,
  lastSyncedAt: null,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  setStatus: (status) => set({ status }),
  setPendingCount: (pendingCount) => set({ pendingCount }),
  setLastSyncedAt: (lastSyncedAt) => set({ lastSyncedAt }),
  setOnline: (isOnline) => set({ isOnline }),
}));
