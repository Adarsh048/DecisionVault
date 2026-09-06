import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface WorkspaceNotification {
  id: string;
  type: 'decision_created' | 'decision_updated' | 'decision_approved';
  title: string;
  message: string;
  decisionId?: string;
  decisionNumber?: number;
  decisionTitle?: string;
  author?: {
    id?: string;
    name: string;
    email?: string;
    role?: string;
  };
  team?: string;
  status?: string;
  createdAt: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: WorkspaceNotification[] = [
  {
    id: 'notif-init-1',
    type: 'decision_created',
    title: 'New Decision Proposed',
    message: 'Sarah Chen proposed ADR-001: "Adopt Hybrid CRDTs & IndexedDB for Local-First Sync"',
    decisionId: 'dec-1',
    decisionNumber: 1,
    decisionTitle: 'Adopt Hybrid CRDTs & IndexedDB for Local-First Sync',
    author: {
      id: 'u-1',
      name: 'Sarah Chen',
      email: 'admin@decisionvault.io',
      role: 'Owner & Lead Architect',
    },
    team: 'Platform Engineering',
    status: 'accepted',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    read: false,
  },
  {
    id: 'notif-init-2',
    type: 'decision_created',
    title: 'New Decision Proposed',
    message: 'Alex Rivera proposed ADR-002: "Migrate Service-to-Service Messaging to Event-Driven WebSockets"',
    decisionId: 'dec-2',
    decisionNumber: 2,
    decisionTitle: 'Migrate Service-to-Service Messaging to Event-Driven WebSockets',
    author: {
      id: 'u-2',
      name: 'Alex Rivera',
      email: 'alex@decisionvault.io',
      role: 'Senior Full-Stack Engineer',
    },
    team: 'Platform Engineering',
    status: 'proposed',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    read: true,
  },
];

interface NotificationStore {
  notifications: WorkspaceNotification[];
  unreadCount: number;
  activeToast: WorkspaceNotification | null;

  // Actions
  addNotification: (notification: Omit<WorkspaceNotification, 'id' | 'read' | 'createdAt'> & Partial<WorkspaceNotification>) => WorkspaceNotification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  dismissToast: () => void;
  simulateTeammateDecision: () => WorkspaceNotification;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: INITIAL_NOTIFICATIONS,
      unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.read).length,
      activeToast: null,

      addNotification: (data) => {
        const newNotif: WorkspaceNotification = {
          id: data.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: data.type || 'decision_created',
          title: data.title || 'New Decision Proposed',
          message: data.message,
          decisionId: data.decisionId,
          decisionNumber: data.decisionNumber,
          decisionTitle: data.decisionTitle,
          author: data.author,
          team: data.team,
          status: data.status,
          createdAt: data.createdAt || new Date().toISOString(),
          read: data.read ?? false,
        };

        const updated = [newNotif, ...get().notifications];
        const unread = updated.filter((n) => !n.read).length;

        set({
          notifications: updated,
          unreadCount: unread,
          activeToast: newNotif,
        });

        return newNotif;
      },

      markAsRead: (id) => {
        const updated = get().notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        });
      },

      markAllAsRead: () => {
        const updated = get().notifications.map((n) => ({ ...n, read: true }));
        set({
          notifications: updated,
          unreadCount: 0,
        });
      },

      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0,
          activeToast: null,
        });
      },

      dismissToast: () => {
        set({ activeToast: null });
      },

      simulateTeammateDecision: () => {
        const teammates = [
          { name: 'Elena Rostova', role: 'Staff SRE', team: 'Infrastructure', title: 'Adopt OpenTelemetry for Distributed Tracing across Microservices' },
          { name: 'Marcus Vance', role: 'Security Architect', team: 'Security', title: 'Enforce Hardware Security Keys (FIDO2/WebAuthn) for Admin Accounts' },
          { name: 'Kai Tanaka', role: 'Staff Frontend Engineer', team: 'Product Engineering', title: 'Transition App State Hydration to Streaming SSR with Edge Fallback' },
          { name: 'Sarah Chen', role: 'Lead Architect', team: 'Platform Engineering', title: 'Standardize gRPC Wire Protocols for Internal Microservices' },
        ];

        const pick = teammates[Math.floor(Math.random() * teammates.length)];
        const nextNum = Math.floor(Math.random() * 20) + 6;

        return get().addNotification({
          type: 'decision_created',
          title: 'New Decision Proposed',
          message: `${pick.name} created ADR-${String(nextNum).padStart(3, '0')}: "${pick.title}"`,
          decisionNumber: nextNum,
          decisionTitle: pick.title,
          author: {
            name: pick.name,
            role: pick.role,
            email: `${pick.name.toLowerCase().replace(' ', '.')}@decisionvault.io`,
          },
          team: pick.team,
          status: 'proposed',
        });
      },
    }),
    {
      name: 'dv-notifications-vault',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);
