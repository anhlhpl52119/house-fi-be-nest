import { sql } from 'drizzle-orm';
import {
  AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { timestamps, uuidPrimaryKey } from './_helpers.js';
import { households } from './households.schema.js';
import { users } from './users.schema.js';

export const categories = pgTable(
  'categories',
  {
    id: uuidPrimaryKey(),
    householdId: uuid('household_id').references(() => households.id),
    parentId: uuid('parent_id').references((): AnyPgColumn => categories.id),
    name: varchar('name', { length: 120 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(),
    icon: varchar('icon', { length: 80 }),
    color: varchar('color', { length: 40 }),
    backgroundColor: varchar('background_color', { length: 40 }),
    textColor: varchar('text_color', { length: 40 }),
    borderColor: varchar('border_color', { length: 40 }),
    description: text('description'),
    isSystem: boolean('is_system').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdByUserId: uuid('created_by_user_id').references(() => users.id),
    ...timestamps(),
  },
  (table) => [
    index('categories_household_type_idx').on(table.householdId, table.type),
    index('categories_system_type_idx').on(table.isSystem, table.type),
    check('categories_type_check', sql`${table.type} in ('income', 'expense')`),
    check(
      'categories_system_owner_check',
      sql`(${table.isSystem} = true and ${table.householdId} is null and ${table.createdByUserId} is null) or (${table.isSystem} = false and ${table.householdId} is not null and ${table.createdByUserId} is not null)`,
    ),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
