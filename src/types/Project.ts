export interface Project {
  id: string;
  name: string;
  githubUrl: string;
  creatorId: string;
  inviteToken?: string;
  invitationEnabled: boolean;
  deletedAt?: Date | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
