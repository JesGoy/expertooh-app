import type { User } from '@/core/domain/entities/User';

export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
}
