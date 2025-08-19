import { pgTable, text, timestamp, integer, varchar, uniqueIndex } from 'drizzle-orm/pg-core';

// Matches Neon table: "User"
export const userTable = pgTable(
  'User',
  {
    id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    firstName: varchar('first_name', { length: 100 }),
    lastName: varchar('last_name', { length: 100 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    status: integer('status'),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      emailUnique: uniqueIndex('User_email_key').on(table.email),
      usernameUnique: uniqueIndex('User_username_key').on(table.username),
    };
  },
);

export type UserRow = typeof userTable.$inferSelect;
