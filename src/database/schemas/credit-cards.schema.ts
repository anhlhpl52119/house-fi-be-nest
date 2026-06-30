import { sql } from 'drizzle-orm';
import { bigint, check, date, index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { timestamps, uuidPrimaryKey } from './_helpers.js';
import { cashTransactions } from './cash-transactions.schema.js';
import { categories } from './categories.schema.js';
import { households } from './households.schema.js';
import { users } from './users.schema.js';

export const creditCardTransactions = pgTable(
  'credit_card_transactions',
  {
    id: uuidPrimaryKey(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    transactionDate: date('transaction_date', { mode: 'string' }).notNull(),
    categoryId: uuid('category_id').references(() => categories.id),
    paidByUserId: uuid('paid_by_user_id').references(() => users.id),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    note: text('note'),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    expectedPaymentDate: date('expected_payment_date', { mode: 'string' }),
    resolvedPaymentId: uuid('resolved_payment_id'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index('credit_card_transactions_household_status_expected_payment_idx').on(
      table.householdId,
      table.status,
      table.expectedPaymentDate,
    ),
    index('credit_card_transactions_household_date_idx').on(table.householdId, table.transactionDate),
    check('credit_card_transactions_amount_check', sql`${table.amount} > 0`),
    check(
      'credit_card_transactions_status_check',
      sql`${table.status} in ('pending', 'resolved', 'cancelled')`,
    ),
  ],
);

export const creditCardPayments = pgTable(
  'credit_card_payments',
  {
    id: uuidPrimaryKey(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id),
    creditCardTransactionId: uuid('credit_card_transaction_id')
      .notNull()
      .references(() => creditCardTransactions.id),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    paymentDate: date('payment_date', { mode: 'string' }).notNull(),
    cashTransactionId: uuid('cash_transaction_id')
      .notNull()
      .references(() => cashTransactions.id),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    note: text('note'),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('credit_card_payments_transaction_unique').on(table.creditCardTransactionId),
    uniqueIndex('credit_card_payments_cash_transaction_unique').on(table.cashTransactionId),
    check('credit_card_payments_amount_check', sql`${table.amount} > 0`),
  ],
);

export type CreditCardTransaction = typeof creditCardTransactions.$inferSelect;
export type NewCreditCardTransaction = typeof creditCardTransactions.$inferInsert;
export type CreditCardPayment = typeof creditCardPayments.$inferSelect;
export type NewCreditCardPayment = typeof creditCardPayments.$inferInsert;
