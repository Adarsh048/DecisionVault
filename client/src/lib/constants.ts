// ─── Roles ───────────────────────────────────────────────────────────────────

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
  viewer: 'Viewer',
};

export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

// ─── Decision Statuses ───────────────────────────────────────────────────────

export const DECISION_STATUS = {
  DRAFT: 'draft',
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  DEPRECATED: 'deprecated',
  SUPERSEDED: 'superseded',
} as const;

export type DecisionStatus = (typeof DECISION_STATUS)[keyof typeof DECISION_STATUS];

export const STATUS_CONFIG: Record<
  DecisionStatus,
  { label: string; color: string; bgClass: string; borderClass: string; dotClass: string }
> = {
  draft: {
    label: 'Draft',
    color: 'text-[#6B6B66] dark:text-[#A0A09B]',
    bgClass: 'bg-[#F4F4F0] dark:bg-[#25282F]',
    borderClass: 'border-[#E8E8E3] dark:border-[#323640]',
    dotClass: 'bg-[#969690]',
  },
  proposed: {
    label: 'Proposed',
    color: 'text-[#9A5B13] dark:text-[#F3B367]',
    bgClass: 'bg-[#FEF7EE] dark:bg-[#2E2619]',
    borderClass: 'border-[#F8DCBA] dark:border-[#523F21]',
    dotClass: 'bg-[#D97706]',
  },
  accepted: {
    label: 'Accepted',
    color: 'text-[#275B3D] dark:text-[#78C295]',
    bgClass: 'bg-[#EBF5EE] dark:bg-[#192B21]',
    borderClass: 'border-[#C6E4D1] dark:border-[#284936]',
    dotClass: 'bg-[#365B4B]',
  },
  deprecated: {
    label: 'Deprecated',
    color: 'text-[#9B2C2C] dark:text-[#F08C8C]',
    bgClass: 'bg-[#FDF2F2] dark:bg-[#2F1D1D]',
    borderClass: 'border-[#F8D7DA] dark:border-[#532626]',
    dotClass: 'bg-[#E53E3E]',
  },
  superseded: {
    label: 'Superseded',
    color: 'text-[#5C5C7A] dark:text-[#B0B0CC]',
    bgClass: 'bg-[#F3F3F8] dark:bg-[#232332]',
    borderClass: 'border-[#E0E0EC] dark:border-[#3D3D54]',
    dotClass: 'bg-[#7C7C9E]',
  },
};

// ─── Sync Status ─────────────────────────────────────────────────────────────

export const SYNC_STATUS = {
  SYNCED: 'synced',
  SYNCING: 'syncing',
  OFFLINE: 'offline',
  ERROR: 'error',
} as const;

export type SyncStatus = (typeof SYNC_STATUS)[keyof typeof SYNC_STATUS];

// ─── Route Paths ─────────────────────────────────────────────────────────────

export const ROUTES = {
  // Public
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Authenticated
  DASHBOARD: '/app/dashboard',
  DECISIONS: '/app/decisions',
  CREATE_DECISION: '/app/decisions/new',
  DECISION_DETAIL: '/app/decisions/:id',
  SEARCH: '/app/search',
  TEAMS: '/app/teams',
  ORGANIZATION_SETTINGS: '/app/settings',
  USER_SETTINGS: '/app/settings/profile',
  ACTIVITY: '/app/activity',
} as const;

// ─── API ─────────────────────────────────────────────────────────────────────

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'DecisionVault';

// ─── Pagination ──────────────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
