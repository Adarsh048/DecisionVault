export interface Comment {
  _id: string;
  decisionId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;

  // Populated
  author?: {
    _id: string;
    name: string;
    avatar?: string;
  };
}
