import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './authStore';

export interface WorkspaceNotification {
  id: string;
  type: 'decision_created' | 'decision_updated' | 'decision_approved';
  title: string;
  message: string;
  decisionId?: string;
  decisionNumber?: number;
  decisionTitle?: string;
  context?: string;
  decisionExcerpt?: string;
  isOwnerProposal?: boolean;
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
  acknowledgedDialog?: boolean;
}

const INITIAL_NOTIFICATIONS: WorkspaceNotification[] = [];

interface NotificationStore {
  notifications: WorkspaceNotification[];
  unreadCount: number;
  activeToast: WorkspaceNotification | null;
  activeProposalDialog: WorkspaceNotification | null;

  // Actions
  addNotification: (
    notification: Omit<WorkspaceNotification, 'id' | 'read' | 'createdAt'> &
      Partial<WorkspaceNotification>
  ) => WorkspaceNotification;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  dismissToast: () => void;
  openProposalDialog: (notification: WorkspaceNotification) => void;
  dismissProposalDialog: (notificationId?: string) => void;
  simulateTeammateDecision: () => WorkspaceNotification;
  simulateOwnerProposal: () => WorkspaceNotification;
  triggerOwnerProposalAlert: (payload: {
    decisionId: string;
    decisionNumber: number;
    decisionTitle: string;
    context?: string;
    decisionExcerpt?: string;
    team?: string;
    status?: string;
    author: {
      id?: string;
      name: string;
      email?: string;
      role?: string;
    };
  }) => WorkspaceNotification;
}

// Setup cross-tab broadcast channel
let notificationBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    notificationBroadcastChannel = new BroadcastChannel('dv_notifications_bus');
  }
} catch {
  // BroadcastChannel not available
}

export const hasSeenDecisionDialog = (decisionId?: string, userEmail?: string): boolean => {
  if (!decisionId || !userEmail) return false;
  try {
    return localStorage.getItem(`dv-dialog-seen-${decisionId}-${userEmail.toLowerCase()}`) === 'true';
  } catch {
    return false;
  }
};

export const markDecisionDialogSeen = (decisionId?: string, userEmail?: string) => {
  if (!decisionId || !userEmail) return;
  try {
    localStorage.setItem(`dv-dialog-seen-${decisionId}-${userEmail.toLowerCase()}`, 'true');
  } catch {
    // Ignore
  }
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: INITIAL_NOTIFICATIONS,
      unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.read).length,
      activeToast: null,
      activeProposalDialog: null,

      addNotification: (data) => {
        const isOwner =
          data.isOwnerProposal ??
          Boolean(
            data.author?.role?.toLowerCase().includes('owner') ||
            data.author?.email?.toLowerCase().includes('admin@') ||
            data.author?.email?.toLowerCase().includes('sarah@')
          );

        const newNotif: WorkspaceNotification = {
          id: data.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          type: data.type || 'decision_created',
          title: data.title || (isOwner ? '👑 Owner Proposed New Decision' : 'New Decision Proposed'),
          message: data.message,
          decisionId: data.decisionId,
          decisionNumber: data.decisionNumber,
          decisionTitle: data.decisionTitle,
          context: data.context,
          decisionExcerpt: data.decisionExcerpt,
          isOwnerProposal: isOwner,
          author: data.author,
          team: data.team,
          status: data.status,
          createdAt: data.createdAt || new Date().toISOString(),
          read: data.read ?? false,
          acknowledgedDialog: data.acknowledgedDialog ?? false,
        };

        // Avoid adding duplicate notification if identical id or same decision proposal
        const existingList = get().notifications;
        const isDuplicate = existingList.some(
          (n) => n.id === newNotif.id || (n.decisionId && n.decisionId === newNotif.decisionId && n.type === newNotif.type)
        );

        const updated = isDuplicate
          ? existingList.map((n) => (n.decisionId === newNotif.decisionId ? { ...n, ...newNotif } : n))
          : [newNotif, ...existingList];
        const unread = updated.filter((n) => !n.read).length;

        // Check if the current user is the author
        const currentUser = useAuthStore.getState().user;
        const isCurrentUserAuthor =
          currentUser?.email && newNotif.author?.email &&
          currentUser.email.toLowerCase() === newNotif.author.email.toLowerCase();

        // Check if user has already seen or acknowledged the dialog for this decision
        const alreadySeenByUser =
          Boolean(newNotif.acknowledgedDialog) ||
          hasSeenDecisionDialog(newNotif.decisionId, currentUser?.email);

        // For non-authors, show the Toast and the Dialogue Box ONLY ONCE!
        const shouldShowDialog = !isCurrentUserAuthor && !alreadySeenByUser;

        if (shouldShowDialog && newNotif.decisionId && currentUser?.email) {
          markDecisionDialogSeen(newNotif.decisionId, currentUser.email);
        }

        set({
          notifications: updated,
          unreadCount: unread,
          activeToast: !isCurrentUserAuthor && !alreadySeenByUser ? newNotif : null,
          activeProposalDialog: isCurrentUserAuthor ? null : (shouldShowDialog ? newNotif : get().activeProposalDialog),
        });

        return newNotif;
      },

      markAsRead: (id) => {
        const updated = get().notifications.map((n) =>
          n.id === id ? { ...n, read: true, acknowledgedDialog: true } : n
        );
        set({
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        });
      },

      markAllAsRead: () => {
        const updated = get().notifications.map((n) => ({
          ...n,
          read: true,
          acknowledgedDialog: true,
        }));
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
          activeProposalDialog: null,
        });
      },

      dismissToast: () => {
        set({ activeToast: null });
      },

      openProposalDialog: (notification) => {
        set({ activeProposalDialog: notification });
      },

      dismissProposalDialog: (notificationId) => {
        const currentUser = useAuthStore.getState().user;
        const target = notificationId
          ? get().notifications.find((n) => n.id === notificationId)
          : get().activeProposalDialog;

        if (target?.decisionId && currentUser?.email) {
          markDecisionDialogSeen(target.decisionId, currentUser.email);
        }

        if (notificationId) {
          const updated = get().notifications.map((n) =>
            n.id === notificationId ? { ...n, acknowledgedDialog: true } : n
          );
          set({
            notifications: updated,
            activeProposalDialog: null,
          });
        } else {
          const active = get().activeProposalDialog;
          if (active) {
            const updated = get().notifications.map((n) =>
              n.id === active.id ? { ...n, acknowledgedDialog: true } : n
            );
            set({
              notifications: updated,
              activeProposalDialog: null,
            });
          } else {
            set({ activeProposalDialog: null });
          }
        }
      },

      triggerOwnerProposalAlert: (payload) => {
        const isOwner = true;
        const message = `${payload.author.name} (Owner & Lead Architect) proposed ADR-${String(
          payload.decisionNumber || 1
        ).padStart(3, '0')}: "${payload.decisionTitle}"`;

        const notif = get().addNotification({
          type: 'decision_created',
          title: '👑 Owner Proposed New Decision',
          message,
          decisionId: payload.decisionId,
          decisionNumber: payload.decisionNumber,
          decisionTitle: payload.decisionTitle,
          context: payload.context,
          decisionExcerpt: payload.decisionExcerpt,
          isOwnerProposal: isOwner,
          author: payload.author,
          team: payload.team || 'Platform Engineering',
          status: payload.status || 'proposed',
        });

        // Broadcast to all other tabs via BroadcastChannel
        try {
          if (notificationBroadcastChannel) {
            notificationBroadcastChannel.postMessage({
              type: 'NEW_DECISION_PROPOSAL',
              notification: notif,
            });
          }
        } catch (e) {
          console.error('Error broadcasting proposal across tabs:', e);
        }

        return notif;
      },

      simulateOwnerProposal: () => {
        const ownerProposals = [
          {
            title: 'Adopt Kafka & Debezium for Real-Time Event-Driven Architecture',
            team: 'Core Platform',
            context:
              'Our monolithic synchronous RPC layer has reached peak throughput limits during traffic spikes. We need durable, fault-tolerant event streams with change data capture (CDC) to reliably propagate architectural events to microservices with under 50ms latency.',
            decision:
              'Standardize on Apache Kafka clusters with Debezium CDC for transactional outbox patterns across all critical business entities.',
          },
          {
            title: 'Standardize WebAssembly & Rust Plugins for Edge Decision Evaluation',
            team: 'Infrastructure & Edge',
            context:
              'Executing complex business rules on cloud lambdas incurs cold-start latency and egress costs. We require sandboxed, deterministic near-zero-latency policy execution directly at Cloudflare Edge nodes.',
            decision:
              'Compile all custom decision verification algorithms and security validation filters into WebAssembly binaries running on the V8 isolate engine.',
          },
          {
            title: 'Mandate OpenTelemetry Tracing and Strict SLO Budgets Across Microservices',
            team: 'Reliability Engineering',
            context:
              'Without unified distributed trace IDs and correlation, debugging downstream timeouts between Kubernetes services takes multiple engineering hours.',
            decision:
              'Enforce OpenTelemetry auto-instrumentation on all gRPC and HTTP gateways with automated error budget alerting via Slack and PagerDuty.',
          },
        ];

        const pick = ownerProposals[Math.floor(Math.random() * ownerProposals.length)];
        const nextNum = Math.floor(Math.random() * 50) + 6;

        return get().triggerOwnerProposalAlert({
          decisionId: `dec-sim-${Date.now()}`,
          decisionNumber: nextNum,
          decisionTitle: pick.title,
          context: pick.context,
          decisionExcerpt: pick.decision,
          team: pick.team,
          status: 'proposed',
          author: {
            id: 'u-1',
            name: 'Sarah Chen',
            role: 'Owner & Lead Architect',
            email: 'admin@decisionvault.io',
          },
        });
      },

      simulateTeammateDecision: () => {
        const teammates = [
          {
            name: 'Elena Rostova',
            role: 'Staff SRE',
            team: 'Infrastructure',
            title: 'Adopt OpenTelemetry for Distributed Tracing across Microservices',
            context: 'Service telemetry is fragmented across Datadog, Prometheus, and raw logs.',
          },
          {
            name: 'Marcus Vance',
            role: 'Security Architect',
            team: 'Security',
            title: 'Enforce Hardware Security Keys (FIDO2/WebAuthn) for Admin Accounts',
            context: 'Phishing attacks remain the #1 vector for credential compromise.',
          },
          {
            name: 'Kai Tanaka',
            role: 'Staff Frontend Engineer',
            team: 'Product Engineering',
            title: 'Transition App State Hydration to Streaming SSR with Edge Fallback',
            context: 'Initial render delays on mobile browsers hurt Core Web Vitals.',
          },
        ];

        const pick = teammates[Math.floor(Math.random() * teammates.length)];
        const nextNum = Math.floor(Math.random() * 20) + 6;

        const notif = get().addNotification({
          type: 'decision_created',
          title: 'New Decision Proposed',
          message: `${pick.name} created ADR-${String(nextNum).padStart(3, '0')}: "${pick.title}"`,
          decisionNumber: nextNum,
          decisionTitle: pick.title,
          context: pick.context,
          isOwnerProposal: false,
          author: {
            name: pick.name,
            role: pick.role,
            email: `${pick.name.toLowerCase().replace(' ', '.')}@decisionvault.io`,
          },
          team: pick.team,
          status: 'proposed',
        });

        return notif;
      },
    }),
    {
      name: 'dv-notifications-vault',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            notifications: [],
            unreadCount: 0,
            activeToast: null,
            activeProposalDialog: null,
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const legacyIds = new Set(['dec-1', 'dec-2', 'dec-3', 'dec-4', 'dec-5']);
          // Strictly purge any legacy seed or auto-simulated notifications
          state.notifications = (state.notifications || []).filter((n) => {
            if (n.id.includes('-sim-') || n.id.includes('init') || n.decisionId?.includes('-sim-')) return false;
            if (n.decisionId && legacyIds.has(n.decisionId)) return false;
            return true;
          });
          state.unreadCount = state.notifications.filter((n) => !n.read).length;
          state.activeToast = null;
          state.activeProposalDialog = null;
        }
      },
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

// Listen to multi-tab notifications via BroadcastChannel
if (notificationBroadcastChannel) {
  notificationBroadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'NEW_DECISION_PROPOSAL' && event.data.notification) {
      const incoming: WorkspaceNotification = event.data.notification;
      const currentUser = useAuthStore.getState().user;
      const isAuthor =
        currentUser?.email && incoming.author?.email &&
        currentUser.email.toLowerCase() === incoming.author.email.toLowerCase();

      // Only display dialogue box and toast if current user is not the author
      if (!isAuthor) {
        useNotificationStore.getState().addNotification(incoming);
      }
    }
  };
}
