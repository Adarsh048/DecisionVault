export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  organizations: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  // Extended profile info (future use)
}
