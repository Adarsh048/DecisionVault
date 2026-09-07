import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Role } from '@/lib/constants';
import { organizationService } from '@/services/organizationService';
import { useAuthStore } from './authStore';

export interface PendingUserApproval {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  status: 'pending' | 'approved' | 'rejected';
  assignedRole?: Role;
  assignedTeam?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ApprovedUserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  team: string;
  reviewedBy: string;
  approvedAt: string;
  welcomed: boolean;
}

interface UserApprovalStore {
  approvals: PendingUserApproval[];
  approvedRecords: ApprovedUserRecord[];
  activeWelcomeDialog: ApprovedUserRecord | null;
  isLoading: boolean;

  // Actions
  fetchFromApi: () => Promise<void>;
  addPendingUser: (name: string, email: string) => void;
  approveUser: (id: string, role: Role, team: string, reviewerName?: string) => Promise<void>;
  rejectUser: (id: string, reviewerName?: string) => Promise<void>;
  getUserApproval: (email: string) => PendingUserApproval | undefined;
  openWelcomeDialog: (record: ApprovedUserRecord) => void;
  dismissWelcomeDialog: () => void;
  simulateApprovalWelcome: (role?: Role, team?: string) => void;
  checkAndTriggerWelcome: (email: string) => void;
}

// Setup cross-tab broadcast channel for instant approval synchronization
let approvalBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    approvalBroadcastChannel = new BroadcastChannel('dv_user_approval_bus');
  }
} catch {
  // BroadcastChannel unavailable
}

export const useUserApprovalStore = create<UserApprovalStore>()(
  persist(
    (set, get) => ({
      approvals: [],
      approvedRecords: [],
      activeWelcomeDialog: null,
      isLoading: false,

      fetchFromApi: async () => {
        try {
          set({ isLoading: true });
          const data = await organizationService.getRoster();
          const livePending: PendingUserApproval[] = (data.pendingApprovals || []).map((p) => ({
            id: p.userId,
            name: p.name,
            email: p.email,
            registeredAt: p.registeredAt || p.joinedAt || new Date().toISOString(),
            status: 'pending' as const,
            assignedRole: p.role,
            assignedTeam: p.team,
          })).sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
          set({ approvals: livePending, isLoading: false });

          // Also sync active status for current user if present in members
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            const currentMember = (data.members || []).find(
              (m) => m.userId === currentUser._id || m.email.toLowerCase() === currentUser.email.toLowerCase()
            );
            if (currentMember) {
              const previousStatus = currentUser.membershipStatus;
              useAuthStore.getState().setUser({
                ...currentUser,
                role: currentMember.role,
                membershipStatus: 'active',
              });

              // If user was previously pending or has an un-welcomed approval, trigger welcome dialogue box!
              if (previousStatus === 'pending') {
                get().checkAndTriggerWelcome(currentUser.email);
              }
            }
          }
        } catch {
          set({ isLoading: false });
        }
      },

      addPendingUser: (name, email) => {
        const existing = get().approvals.find((a) => a.email.toLowerCase() === email.toLowerCase());
        if (existing) return;

        const newApproval: PendingUserApproval = {
          id: `appr-${Date.now()}`,
          name,
          email,
          registeredAt: new Date().toISOString(),
          status: 'pending',
        };

        set({ approvals: [newApproval, ...get().approvals] });
      },

      approveUser: async (id, role, team, reviewerName = 'Sarah Chen (Owner)') => {
        const existing = get().approvals.find((a) => a.id === id || a.email.toLowerCase() === id.toLowerCase());
        const targetEmail = existing?.email || id;
        const targetName = existing?.name || 'Teammate';

        const record: ApprovedUserRecord = {
          id,
          name: targetName,
          email: targetEmail,
          role,
          team,
          reviewedBy: reviewerName,
          approvedAt: new Date().toISOString(),
          welcomed: false,
        };

        try {
          await organizationService.assignRole(id, role, team);
        } catch (err) {
          console.error('Failed to assign role via API:', err);
        }

        const remainingPending = get().approvals.filter((a) => a.id !== id && a.email.toLowerCase() !== targetEmail.toLowerCase());
        const updatedApproved = [record, ...get().approvedRecords.filter((r) => r.email.toLowerCase() !== targetEmail.toLowerCase())];

        set({
          approvals: remainingPending,
          approvedRecords: updatedApproved,
        });

        // Broadcast to all other tabs
        try {
          if (approvalBroadcastChannel) {
            approvalBroadcastChannel.postMessage({
              type: 'USER_APPROVED',
              record,
            });
          }
        } catch (e) {
          console.error('Error broadcasting user approval:', e);
        }

        // If the approved user happens to be the active user in this session, update them and show the dialogue box!
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.email.toLowerCase() === targetEmail.toLowerCase()) {
          useAuthStore.getState().setUser({
            ...currentUser,
            role,
            membershipStatus: 'active',
          });
          set({ activeWelcomeDialog: record });
        }
      },

      rejectUser: async (id, _reviewerName = 'Sarah Chen (Owner)') => {
        try {
          await organizationService.rejectRequest(id);
        } catch (err) {
          console.error('Failed to reject via API:', err);
        }
        set({
          approvals: get().approvals.filter((a) => a.id !== id),
        });
      },

      getUserApproval: (email) => {
        return get().approvals.find((a) => a.email.toLowerCase() === email.toLowerCase());
      },

      openWelcomeDialog: (record) => {
        if (!record?.email) return;
        try {
          const alreadySeen = localStorage.getItem(`dv-welcome-seen-${record.email.toLowerCase()}`);
          if (alreadySeen === 'true') return;
        } catch {
          // Ignore
        }
        set({ activeWelcomeDialog: record });
      },

      dismissWelcomeDialog: () => {
        const current = get().activeWelcomeDialog;
        if (current) {
          // Mark as welcomed in storage permanently so it NEVER pops up again
          try {
            localStorage.setItem(`dv-welcome-seen-${current.email.toLowerCase()}`, 'true');
          } catch {
            // Ignore
          }
          const updated = get().approvedRecords.map((r) =>
            r.email.toLowerCase() === current.email.toLowerCase() ? { ...r, welcomed: true } : r
          );
          set({
            approvedRecords: updated,
            activeWelcomeDialog: null,
          });
        } else {
          set({ activeWelcomeDialog: null });
        }
      },

      checkAndTriggerWelcome: (email) => {
        if (!email) return;
        try {
          const alreadySeen = localStorage.getItem(`dv-welcome-seen-${email.toLowerCase()}`);
          if (alreadySeen === 'true') return;
        } catch {
          // Ignore
        }

        // ONLY trigger for users who actually have an un-welcomed approval record from their request!
        const approvedEntry = get().approvedRecords.find(
          (r) => r.email.toLowerCase() === email.toLowerCase() && !r.welcomed
        );

        if (approvedEntry) {
          // Mark as permanently seen right away so it will NEVER show repeatedly on refreshes or subsequent logins
          try {
            localStorage.setItem(`dv-welcome-seen-${email.toLowerCase()}`, 'true');
          } catch {
            // Ignore
          }
          const updated = get().approvedRecords.map((r) =>
            r.email.toLowerCase() === email.toLowerCase() ? { ...r, welcomed: true } : r
          );
          set({
            approvedRecords: updated,
            activeWelcomeDialog: approvedEntry,
          });
        }
      },

      simulateApprovalWelcome: (role = 'member', team = 'Platform Engineering') => {
        const currentUser = useAuthStore.getState().user;
        const testRecord: ApprovedUserRecord = {
          id: currentUser?._id || 'u-approved',
          name: currentUser?.name || 'Alex Rivera',
          email: currentUser?.email || 'alex@decisionvault.io',
          role,
          team,
          reviewedBy: 'Sarah Chen (Owner & Lead Architect)',
          approvedAt: new Date().toISOString(),
          welcomed: false,
        };

        set({ activeWelcomeDialog: testRecord });
      },
    }),
    {
      name: 'dv-user-approvals',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        approvals: state.approvals,
        approvedRecords: state.approvedRecords,
      }),
    }
  )
);

// Listen to multi-tab approval events
if (approvalBroadcastChannel) {
  approvalBroadcastChannel.onmessage = (event) => {
    if (event.data?.type === 'USER_APPROVED' && event.data.record) {
      const record: ApprovedUserRecord = event.data.record;
      const currentUser = useAuthStore.getState().user;

      // Update approved records in store
      const existing = useUserApprovalStore.getState().approvedRecords;
      const updated = [record, ...existing.filter((r) => r.email.toLowerCase() !== record.email.toLowerCase())];
      useUserApprovalStore.setState({
        approvedRecords: updated,
        approvals: useUserApprovalStore.getState().approvals.filter((a) => a.email.toLowerCase() !== record.email.toLowerCase()),
      });

      // If the approved user is currently logged in on this tab, unlock their session and show the dialogue box!
      if (currentUser && currentUser.email.toLowerCase() === record.email.toLowerCase()) {
        useAuthStore.getState().setUser({
          ...currentUser,
          role: record.role,
          membershipStatus: 'active',
        });
        useUserApprovalStore.getState().openWelcomeDialog(record);
      }
    }
  };
}
