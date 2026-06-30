import { sql } from 'drizzle-orm';
import { bigint, check, date, index, pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

import { timestamps, uuidPrimaryKey } from './_helpers.js';
import { categories } from './categories.schema.js';
import { households } from './households.schema.js';
import { users } from './users.schema.js';

export const cashTransactions = pgTable(
  'cash_transactions',
  {
    id: uuidPrimaryKey(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id),
    type: varchar('type', { length: 20 }).notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    transactionDate: date('transaction_date', { mode: 'string' }).notNull(),
    categoryId: uuid('category_id').references(() => categories.id),
    paidByUserId: uuid('paid_by_user_id').references(() => users.id),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    note: text('note'),
    sourceType: varchar('source_type', { length: 40 }),
    sourceId: uuid('source_id'),
    ...timestamps(),
  },
  (table) => [
    index('cash_transactions_household_date_idx').on(table.householdId, table.transactionDate),
    index('cash_transactions_household_type_date_idx').on(
      table.householdId,
      table.type,
      table.transactionDate,
    ),
    index('cash_transactions_household_paid_by_date_idx').on(
      table.householdId,
      table.paidByUserId,
      table.transactionDate,
    ),
    check('cash_transactions_type_check', sql`${table.type} in ('income', 'expense')`),
    check('cash_transactions_amount_check', sql`${table.amount} > 0`),
    check(
      'cash_transactions_source_type_check',
      sql`${table.sourceType} is null or ${table.sourceType} in ('asset_transaction', 'saving_deposit', 'saving_maturity', 'credit_card_payment', 'installment_payment', 'manual')`,
    ),
  ],
);

export type CashTransaction = typeof cashTransactions.$inferSelect;
export type NewCashTransaction = typeof cashTransactions.$inferInsert;
