export interface Activity {
  _id: string;
  organizationId: string;
  decisionId?: string;
  userId: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;

  // Populated
  user?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  decision?: {
    _id: string;
    title: string;
  };
}
