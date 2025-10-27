import type { User } from '@/core/domain/entities/User';

export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(userId: number): Promise<User | null>;
  updatePassword(userId: number, newPasswordHash: string): Promise<void>;
}
