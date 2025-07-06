export interface Project {
  id: string;
  name: string;
  githubUrl: string;
  creatorId: string;
  inviteToken?: string;
  deletedAt?: Date | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
