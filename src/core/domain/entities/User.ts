import type { UserProfile } from '../constants/profiles';

export type UserId = string;

export interface User {
  id: UserId;
  username: string;
  name: string;
  passwordHash: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isActive?: boolean;
  profile: UserProfile;
  lastLoginAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}
