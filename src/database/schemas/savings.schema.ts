import { sql } from 'drizzle-orm';
import { bigint, check, date, index, integer, numeric, pgTable, text, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { timestamps, uuidPrimaryKey } from './_helpers.js';
import { cashTransactions } from './cash-transactions.schema.js';
import { households } from './households.schema.js';
import { users } from './users.schema.js';

export const savingDeposits = pgTable(
  'saving_deposits',
  {
    id: uuidPrimaryKey(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id),
    bankName: varchar('bank_name', { length: 160 }).notNull(),
    principalAmount: bigint('principal_amount', { mode: 'bigint' }).notNull(),
    interestRate: numeric('interest_rate', { precision: 8, scale: 4 }).notNull(),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    maturityDate: date('maturity_date', { mode: 'string' }).notNull(),
    termMonths: integer('term_months'),
    expectedInterestAmount: bigint('expected_interest_amount', { mode: 'bigint' }),
    actualInterestAmount: bigint('actual_interest_amount', { mode: 'bigint' }),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    depositCashTransactionId: uuid('deposit_cash_transaction_id')
      .notNull()
      .references(() => cashTransactions.id),
    maturityCashTransactionId: uuid('maturity_cash_transaction_id').references(() => cashTransactions.id),
    paidByUserId: uuid('paid_by_user_id').references(() => users.id),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    note: text('note'),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('saving_deposits_deposit_cash_transaction_unique').on(table.depositCashTransactionId),
    uniqueIndex('saving_deposits_maturity_cash_transaction_unique').on(table.maturityCashTransactionId),
    index('saving_deposits_household_status_maturity_idx').on(
      table.householdId,
      table.status,
      table.maturityDate,
    ),
    check('saving_deposits_principal_amount_check', sql`${table.principalAmount} > 0`),
    check('saving_deposits_interest_rate_check', sql`${table.interestRate} >= 0`),
    check('saving_deposits_maturity_date_check', sql`${table.maturityDate} >= ${table.startDate}`),
    check('saving_deposits_term_months_check', sql`${table.termMonths} is null or ${table.termMonths} > 0`),
    check(
      'saving_deposits_expected_interest_amount_check',
      sql`${table.expectedInterestAmount} is null or ${table.expectedInterestAmount} >= 0`,
    ),
    check(
      'saving_deposits_actual_interest_amount_check',
      sql`${table.actualInterestAmount} is null or ${table.actualInterestAmount} >= 0`,
    ),
    check(
      'saving_deposits_status_check',
      sql`${table.status} in ('active', 'matured', 'withdrawn', 'cancelled')`,
    ),
  ],
);

export type SavingDeposit = typeof savingDeposits.$inferSelect;
export type NewSavingDeposit = typeof savingDeposits.$inferInsert;
