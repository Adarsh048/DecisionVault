export interface Team {
  _id: string;
  name: string;
  description?: string;
  organizationId: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}
