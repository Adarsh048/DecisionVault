import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Role } from '@/lib/constants';
import { organizationService } from '@/services/organizationService';

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

interface UserApprovalStore {
  approvals: PendingUserApproval[];
  isLoading: boolean;

  // Actions
  fetchFromApi: () => Promise<void>;
  addPendingUser: (name: string, email: string) => void;
  approveUser: (id: string, role: Role, team: string, reviewerName?: string) => Promise<void>;
  rejectUser: (id: string, reviewerName?: string) => Promise<void>;
  getUserApproval: (email: string) => PendingUserApproval | undefined;
}

export const useUserApprovalStore = create<UserApprovalStore>()(
  persist(
    (set, get) => ({
      approvals: [],
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
          }));
          set({ approvals: livePending, isLoading: false });
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

      approveUser: async (id, role, team, _reviewerName = 'Sarah Chen (Owner)') => {
        try {
          await organizationService.assignRole(id, role, team);
        } catch (err) {
          console.error('Failed to assign role via API:', err);
        }
        set({
          approvals: get().approvals.filter((a) => a.id !== id),
        });
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
    }),
    {
      name: 'dv-user-approvals',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

