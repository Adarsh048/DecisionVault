export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export const DECISION_STATUS = {
  DRAFT: 'draft',
  PROPOSED: 'proposed',
  ACCEPTED: 'accepted',
  DEPRECATED: 'deprecated',
  SUPERSEDED: 'superseded',
} as const;

export type DecisionStatus = (typeof DECISION_STATUS)[keyof typeof DECISION_STATUS];

export const ACTIVITY_ACTIONS = {
  CREATED: 'created',
  UPDATED: 'updated',
  COMMENTED: 'commented',
  STATUS_CHANGED: 'status_changed',
  MEMBER_ADDED: 'member_added',
  MEMBER_REMOVED: 'member_removed',
  DELETED: 'deleted',
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
