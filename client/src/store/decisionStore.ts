import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DecisionStatus } from '@/lib/constants';
import { db } from '@/lib/db';
import { syncEngine } from '@/services/syncEngine';
import { useAuthStore } from './authStore';

export interface VoterRecord {
  userId: string;
  userName: string;
  userEmail?: string;
  userRole: string;
  option: 'up' | 'down';
  votedAt: string;
}

export interface DecisionRecord {
  id: string;
  number: number;
  title: string;
  status: DecisionStatus;
  team: string;
  tags: string[];
  context: string;
  decision: string;
  consequences: string;
  alternatives?: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  votes: {
    up: number;
    down: number;
    userVote?: 'up' | 'down';
    voters?: VoterRecord[];
  };
  createdAt: string;
  updatedAt: string;
}

export const INITIAL_DECISIONS: DecisionRecord[] = [];

interface DecisionStore {
  decisions: DecisionRecord[];
  searchQuery: string;
  selectedStatus: string | null;
  selectedTeam: string | null;
  selectedTag: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedStatus: (status: string | null) => void;
  setSelectedTeam: (team: string | null) => void;
  setSelectedTag: (tag: string | null) => void;
  addDecision: (decision: Omit<DecisionRecord, 'id' | 'number' | 'votes' | 'createdAt' | 'updatedAt'>) => DecisionRecord;
  receiveRemoteDecision: (decision: DecisionRecord) => void;
  updateDecisionStatus: (id: string, status: DecisionStatus) => void;
  voteDecision: (id: string, type: 'up' | 'down', voterInfo?: Partial<VoterRecord>) => void;
  clearAllDecisions: () => void;
}

export const useDecisionStore = create<DecisionStore>()(
  persist(
    (set, get) => ({
      decisions: INITIAL_DECISIONS,
      searchQuery: '',
      selectedStatus: null,
      selectedTeam: null,
      selectedTag: null,

      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedStatus: (selectedStatus) => set({ selectedStatus }),
      setSelectedTeam: (selectedTeam) => set({ selectedTeam }),
      setSelectedTag: (selectedTag) => set({ selectedTag }),

      addDecision: (data) => {
        const current = get().decisions;
        const highestNumber = current.reduce((max, d) => Math.max(max, d.number || 0), 0);
        // Ensure new decisions can only start as 'proposed' or 'draft' (cannot be 'accepted' or 'deprecated' initially)
        const initialStatus: DecisionStatus = data.status === 'draft' ? 'draft' : 'proposed';

        const authorVoter: VoterRecord = {
          userId: data.author.id,
          userName: data.author.name,
          userEmail: data.author.email,
          userRole: data.author.role,
          option: 'up',
          votedAt: new Date().toISOString(),
        };

        const newRecord: DecisionRecord = {
          ...data,
          status: initialStatus,
          id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          number: highestNumber + 1,
          votes: {
            up: 1,
            down: 0,
            userVote: 'up',
            voters: [authorVoter],
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 1. Instant local state update (0ms latency)
        set({ decisions: [newRecord, ...current] });

        // 2. Persist to IndexedDB
        db.decisions.put({ ...newRecord, synced: false }).catch(console.error);

        // 3. Queue to outbox for sync
        syncEngine.enqueue('create_decision', newRecord).catch(console.error);

        return newRecord;
      },

      receiveRemoteDecision: (remoteRecord) => {
        const current = get().decisions;
        const exists = current.some((d) => d.id === remoteRecord.id || (d.number === remoteRecord.number && d.title === remoteRecord.title));
        if (!exists) {
          set({ decisions: [remoteRecord, ...current] });
          db.decisions.put({ ...remoteRecord, synced: true }).catch(console.error);
        }
      },

      updateDecisionStatus: (id, status) => {
        const updatedAt = new Date().toISOString();
        set({
          decisions: get().decisions.map((d) =>
            d.id === id ? { ...d, status, updatedAt } : d
          ),
        });

        // Persist to IndexedDB
        db.decisions.update(id, { status, updatedAt, synced: false }).catch(console.error);

        // Queue to outbox for sync
        syncEngine.enqueue('update_status', { id, status, updatedAt }).catch(console.error);
      },

      voteDecision: (id, type, voterInfo) => {
        let updatedVotes: DecisionRecord['votes'] | null = null;
        const authUser = useAuthStore.getState().user;
        const voterId = voterInfo?.userId || authUser?._id || 'u-local';
        const voterName = voterInfo?.userName || authUser?.name || 'Authorized Engineer';
        const voterEmail = voterInfo?.userEmail || authUser?.email || 'engineer@decisionvault.io';
        const voterRole = voterInfo?.userRole || authUser?.role || 'Staff Engineer';

        set({
          decisions: get().decisions.map((d) => {
            if (d.id !== id) return d;

            const existingVoters: VoterRecord[] = Array.isArray(d.votes?.voters)
              ? [...d.votes.voters]
              : [];

            const existingIdx = existingVoters.findIndex(
              (v) => (v.userId && v.userId === voterId) || (v.userEmail && v.userEmail === voterEmail)
            );

            let newVoters: VoterRecord[];
            let newUserVote: 'up' | 'down' | undefined = undefined;

            if (existingIdx >= 0) {
              const currentVoter = existingVoters[existingIdx];
              if (currentVoter.option === type) {
                // Clicking the same option toggles it off
                newVoters = existingVoters.filter((_, idx) => idx !== existingIdx);
                newUserVote = undefined;
              } else {
                // Switching choice (e.g. from 'up' to 'down' or 'down' to 'up')
                newVoters = [
                  ...existingVoters.slice(0, existingIdx),
                  {
                    ...currentVoter,
                    userName: voterName,
                    userRole: voterRole,
                    option: type,
                    votedAt: new Date().toISOString(),
                  },
                  ...existingVoters.slice(existingIdx + 1),
                ];
                newUserVote = type;
              }
            } else {
              // Brand new vote by this user
              newVoters = [
                ...existingVoters,
                {
                  userId: voterId,
                  userName: voterName,
                  userEmail: voterEmail,
                  userRole: voterRole,
                  option: type,
                  votedAt: new Date().toISOString(),
                },
              ];
              newUserVote = type;
            }

            const upCount = newVoters.filter((v) => v.option === 'up').length;
            const downCount = newVoters.filter((v) => v.option === 'down').length;

            updatedVotes = {
              up: upCount,
              down: downCount,
              userVote: newUserVote,
              voters: newVoters,
            };

            return { ...d, votes: updatedVotes, updatedAt: new Date().toISOString() };
          }),
        });

        if (updatedVotes) {
          db.decisions.update(id, { votes: updatedVotes }).catch(console.error);
          syncEngine.enqueue('vote_decision', { id, type, votes: updatedVotes }).catch(console.error);
        }
      },

      clearAllDecisions: () => {
        set({ decisions: [] });
        db.decisions.clear().catch(console.error);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('dv-notifications-vault');
        }
      },
    }),
    {
      name: 'dv-decisions',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Strictly delete legacy seed records (dec-1 through dec-5)
          state.decisions = (state.decisions || []).filter(
            (d) => !['dec-1', 'dec-2', 'dec-3', 'dec-4', 'dec-5'].includes(d.id)
          );
        }
      },
    }
  )
);
