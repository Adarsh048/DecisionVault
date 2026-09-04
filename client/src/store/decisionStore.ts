import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DecisionStatus } from '@/lib/constants';

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
  };
  createdAt: string;
  updatedAt: string;
}

const INITIAL_DECISIONS: DecisionRecord[] = [
  {
    id: 'dec-1',
    number: 1,
    title: 'Adopt Hybrid CRDTs & IndexedDB for Local-First Sync',
    status: 'accepted',
    team: 'Platform Engineering',
    tags: ['Architecture', 'Offline-First', 'Database', 'Realtime'],
    context:
      'Engineers frequently travel or experience spotty connectivity while reviewing and proposing architectural changes. Standard client-server REST APIs freeze or lose in-flight drafts when connectivity drops.',
    decision:
      'We will standardize on an IndexedDB local-first storage model coupled with Conflict-free Replicated Data Types (CRDTs) and WebSocket heartbeats for background bidirectional reconciliation.',
    consequences:
      'Zero latency on all write operations locally. Guarantees eventual consistency without database locking overhead. Requires client-side schema migration support.',
    author: {
      id: 'u-1',
      name: 'Sarah Chen',
      email: 'admin@decisionvault.io',
      role: 'Owner & Lead Architect',
    },
    votes: { up: 14, down: 0 },
    createdAt: '2026-08-28T14:20:00Z',
    updatedAt: '2026-09-01T09:15:00Z',
  },
  {
    id: 'dec-2',
    number: 2,
    title: 'Migrate Service-to-Service Messaging to Event-Driven WebSockets',
    status: 'proposed',
    team: 'Platform Engineering',
    tags: ['WebSockets', 'Realtime', 'Infrastructure'],
    context:
      'Current polling mechanisms for live decision updates create excessive server load during peak collaborative review hours and introduce up to 10 seconds of sync latency.',
    decision:
      'Implement Socket.io rooms segregated by organizationId and teamId to broadcast real-time decision mutations, status changes, and concurrent reviewer presence.',
    consequences:
      'Instantaneous feedback across all open browser sessions. Lower bandwidth consumption on idle connections.',
    author: {
      id: 'u-2',
      name: 'Alex Rivera',
      email: 'alex@decisionvault.io',
      role: 'Senior Full-Stack Engineer',
    },
    votes: { up: 8, down: 1 },
    createdAt: '2026-09-02T11:45:00Z',
    updatedAt: '2026-09-03T16:30:00Z',
  },
  {
    id: 'dec-3',
    number: 3,
    title: 'Standardize RBAC Hierarchy: Owner, Admin, Member, Stakeholder',
    status: 'accepted',
    team: 'Product & Design',
    tags: ['Security', 'RBAC', 'Compliance'],
    context:
      'We need distinct permission tiers so stakeholders and compliance reviewers can audit historical decisions without accidentally modifying or deleting architectural records.',
    decision:
      'Enforce 4 strict tiers: Owner (full admin & billing), Admin (team management), Member (engineer author & editor), and Viewer/Stakeholder (strictly read-only review with discussion rights).',
    consequences:
      'Satisfies SOC2 audit trail criteria. Stakeholders get uninhibited exploration without write risk.',
    author: {
      id: 'u-1',
      name: 'Sarah Chen',
      email: 'admin@decisionvault.io',
      role: 'Owner & Lead Architect',
    },
    votes: { up: 19, down: 0 },
    createdAt: '2026-08-20T10:00:00Z',
    updatedAt: '2026-08-22T13:00:00Z',
  },
  {
    id: 'dec-4',
    number: 4,
    title: 'Deprecate Legacy Polling Sync Engine in Favor of Push Notifications',
    status: 'deprecated',
    team: 'Platform Engineering',
    tags: ['Legacy', 'Sync', 'Deprecation'],
    context:
      'The original v1 decision sync relied on 30-second interval polling which depleted mobile battery and led to occasional merge conflicts.',
    decision:
      'Deprecate HTTP long-polling and transition all clients to the WebSocket sync manager.',
    consequences:
      'Reduces cloud instance compute costs by 34%. Removes legacy polling routes from server.',
    author: {
      id: 'u-2',
      name: 'Alex Rivera',
      email: 'alex@decisionvault.io',
      role: 'Senior Full-Stack Engineer',
    },
    votes: { up: 12, down: 2 },
    createdAt: '2026-07-15T08:30:00Z',
    updatedAt: '2026-08-30T10:00:00Z',
  },
  {
    id: 'dec-5',
    number: 5,
    title: 'Universal Markdown Specification with Mermaid Diagramming',
    status: 'draft',
    team: 'Product & Design',
    tags: ['Markdown', 'Diagrams', 'Documentation'],
    context:
      'Complex architectural decisions require sequence and architecture diagrams embedded directly inside the decision context.',
    decision:
      'Support GitHub Flavored Markdown and client-side Mermaid.js rendering within all decision records.',
    consequences:
      'Enables richer visual proposals without external image hosting dependencies.',
    author: {
      id: 'u-3',
      name: 'Jordan Lee',
      email: 'viewer@decisionvault.io',
      role: 'Product Operations',
    },
    votes: { up: 5, down: 0 },
    createdAt: '2026-09-03T17:10:00Z',
    updatedAt: '2026-09-04T08:00:00Z',
  },
];

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
  updateDecisionStatus: (id: string, status: DecisionStatus) => void;
  voteDecision: (id: string, type: 'up' | 'down') => void;
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
        const newRecord: DecisionRecord = {
          ...data,
          id: `dec-${Date.now()}`,
          number: current.length + 1,
          votes: { up: 1, down: 0, userVote: 'up' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ decisions: [newRecord, ...current] });
        return newRecord;
      },

      updateDecisionStatus: (id, status) => {
        set({
          decisions: get().decisions.map((d) =>
            d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d
          ),
        });
      },

      voteDecision: (id, type) => {
        set({
          decisions: get().decisions.map((d) => {
            if (d.id !== id) return d;
            const currentVote = d.votes.userVote;
            let up = d.votes.up;
            let down = d.votes.down;

            if (currentVote === type) {
              // Toggle off
              if (type === 'up') up = Math.max(0, up - 1);
              if (type === 'down') down = Math.max(0, down - 1);
              return { ...d, votes: { up, down, userVote: undefined } };
            }

            if (currentVote === 'up') up = Math.max(0, up - 1);
            if (currentVote === 'down') down = Math.max(0, down - 1);

            if (type === 'up') up += 1;
            if (type === 'down') down += 1;

            return { ...d, votes: { up, down, userVote: type } };
          }),
        });
      },
    }),
    {
      name: 'dv-decisions',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
