import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Organization } from '@/types/organization';
import type { Team } from '@/types/team';

interface OrganizationState {
  activeOrganization: Organization | null;
  activeTeam: Team | null;

  // Actions
  setActiveOrganization: (org: Organization | null) => void;
  setActiveTeam: (team: Team | null) => void;
  clearOrganization: () => void;
}

/**
 * Organization store tracks which org and team the user is currently working in.
 * Persisted so the user returns to their last-used context.
 */
export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      activeOrganization: null,
      activeTeam: null,

      setActiveOrganization: (org) => set({ activeOrganization: org, activeTeam: null }),
      setActiveTeam: (team) => set({ activeTeam: team }),
      clearOrganization: () => set({ activeOrganization: null, activeTeam: null }),
    }),
    {
      name: 'dv-org',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
