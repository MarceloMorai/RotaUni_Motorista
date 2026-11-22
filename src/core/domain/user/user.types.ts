export type UserProfile = {
  userId: string;
  name: string;
  university: string;
  campus: string;
  course?: string;
  rating?: number | null;
  createdAt: string;
};

export type CreateUserInput = Pick<UserProfile, 'name' | 'university' | 'campus'> & { course?: string };
