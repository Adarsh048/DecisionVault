import api from './api';
import type { Role } from '@/lib/constants';

export interface OrgRosterMember {
  userId: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'pending';
  team: string;
  joinedAt?: string;
}

export interface OrgPendingApproval {
  userId: string;
  name: string;
  email: string;
  role: Role;
  status: 'pending';
  team: string;
  registeredAt?: string;
  joinedAt?: string;
}

export interface OrgTeam {
  id: string;
  name: string;
  description: string;
  membersCount: number;
}

export interface OrgRosterResponse {
  organization: {
    id: string;
    name: string;
    slug: string;
    owner: string;
  };
  isOwner: boolean;
  members: OrgRosterMember[];
  pendingApprovals: OrgPendingApproval[];
  teams: OrgTeam[];
}

export const organizationService = {
  async getRoster(): Promise<OrgRosterResponse> {
    const res = await api.get('/organizations/roster');
    return res.data.data;
  },

  async assignRole(userId: string, role: Role, teamName: string): Promise<{ message: string }> {
    const res = await api.post('/organizations/assign-role', { userId, role, teamName });
    return res.data;
  },

  async rejectRequest(userId: string): Promise<{ message: string }> {
    const res = await api.post('/organizations/reject-request', { userId });
    return res.data;
  },

  async removeMember(orgId: string, userId: string): Promise<void> {
    await api.delete(`/organizations/${orgId}/members/${userId}`);
  },
};
