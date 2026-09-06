import type { Role } from '@/lib/constants';

export interface OrganizationMember {
  userId: string;
  role: Role;
  status?: 'active' | 'pending' | 'rejected';
  joinedAt: string;
  user?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  owner: string;
  members: OrganizationMember[];
  createdAt: string;
  updatedAt: string;
}
