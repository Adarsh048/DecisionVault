import type { Role } from '@/lib/constants';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: Role;
  membershipStatus?: 'active' | 'pending' | 'rejected';
  organizations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  // Extended profile info (future use)
}

