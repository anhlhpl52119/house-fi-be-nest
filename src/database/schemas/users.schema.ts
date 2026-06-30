import { boolean, index, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { timestamps, uuidPrimaryKey } from './_helpers.js';

export const users = pgTable(
  'users',
  {
    id: uuidPrimaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: varchar('display_name', { length: 120 }).notNull(),
    avatarUrl: text('avatar_url'),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps(),
  },
  (table) => [uniqueIndex('users_email_unique').on(table.email), index('users_email_idx').on(table.email)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
