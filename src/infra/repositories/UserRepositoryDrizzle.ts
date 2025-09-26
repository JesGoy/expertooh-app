import type { UserRepository } from '@/core/application/ports/UserRepository';
import type { User } from '@/core/domain/entities/User';
import { getDb } from '@/infra/db/client';
import { userTable } from '@/infra/db/schema';
import { eq } from 'drizzle-orm';

export class UserRepositoryDrizzle implements UserRepository {
  async findByUsername(username: string): Promise<User | null> {
    const db = getDb();
    const rows = await db.select().from(userTable).where(eq(userTable.username, username)).limit(1);
    const row = rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      username: row.username,
      email: row.email,
      name: [row.firstName, row.lastName].filter(Boolean).join(' ') || 'undefined',
      profile: row.profile || 'user',
      isActive: (row.status ?? 1) === 1,
      passwordHash: row.passwordHash,
    } satisfies User;
  }

  
}
