import { boolean, check, index, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { timestamps, uuidPrimaryKey } from './_helpers.js';
import { users } from './users.schema.js';

export const households = pgTable('households', {
  id: uuidPrimaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  createdByUserId: uuid('created_by_user_id')
    .notNull()
    .references(() => users.id),
  ...timestamps(),
});

export const householdMembers = pgTable(
  'household_members',
  {
    id: uuidPrimaryKey(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    role: varchar('role', { length: 20 }).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean('is_active').notNull().default(true),
  },
  (table) => [
    uniqueIndex('household_members_household_user_unique').on(table.householdId, table.userId),
    index('household_members_user_idx').on(table.userId),
    index('household_members_household_user_idx').on(table.householdId, table.userId),
    check('household_members_role_check', sql`${table.role} in ('owner', 'member')`),
  ],
);

export type Household = typeof households.$inferSelect;
export type NewHousehold = typeof households.$inferInsert;
export type HouseholdMember = typeof householdMembers.$inferSelect;
export type NewHouseholdMember = typeof householdMembers.$inferInsert;
