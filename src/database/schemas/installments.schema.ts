import { sql } from 'drizzle-orm';
import { bigint, check, date, index, integer, pgTable, text, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { timestamps, uuidPrimaryKey } from './_helpers.js';
import { cashTransactions } from './cash-transactions.schema.js';
import { categories } from './categories.schema.js';
import { households } from './households.schema.js';
import { users } from './users.schema.js';

export const installmentPlans = pgTable(
  'installment_plans',
  {
    id: uuidPrimaryKey(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id),
    originalAmount: bigint('original_amount', { mode: 'bigint' }).notNull(),
    purchaseDate: date('purchase_date', { mode: 'string' }).notNull(),
    categoryId: uuid('category_id').references(() => categories.id),
    paidByUserId: uuid('paid_by_user_id').references(() => users.id),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    note: text('note'),
    installmentCount: integer('installment_count').notNull(),
    monthlyAmount: bigint('monthly_amount', { mode: 'bigint' }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    ...timestamps(),
  },
  (table) => [
    check('installment_plans_original_amount_check', sql`${table.originalAmount} > 0`),
    check('installment_plans_installment_count_check', sql`${table.installmentCount} > 0`),
    check('installment_plans_monthly_amount_check', sql`${table.monthlyAmount} > 0`),
    check('installment_plans_status_check', sql`${table.status} in ('active', 'completed', 'cancelled')`),
  ],
);

export const installmentPayments = pgTable(
  'installment_payments',
  {
    id: uuidPrimaryKey(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id),
    installmentPlanId: uuid('installment_plan_id')
      .notNull()
      .references(() => installmentPlans.id),
    sequenceNo: integer('sequence_no').notNull(),
    amount: bigint('amount', { mode: 'bigint' }).notNull(),
    dueDate: date('due_date', { mode: 'string' }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    paidDate: date('paid_date', { mode: 'string' }),
    cashTransactionId: uuid('cash_transaction_id').references(() => cashTransactions.id),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('installment_payments_plan_sequence_unique').on(
      table.installmentPlanId,
      table.sequenceNo,
    ),
    uniqueIndex('installment_payments_cash_transaction_unique').on(table.cashTransactionId),
    index('installment_payments_household_status_due_date_idx').on(
      table.householdId,
      table.status,
      table.dueDate,
    ),
    check('installment_payments_sequence_no_check', sql`${table.sequenceNo} > 0`),
    check('installment_payments_amount_check', sql`${table.amount} > 0`),
    check('installment_payments_status_check', sql`${table.status} in ('pending', 'paid', 'cancelled')`),
  ],
);

export type InstallmentPlan = typeof installmentPlans.$inferSelect;
export type NewInstallmentPlan = typeof installmentPlans.$inferInsert;
export type InstallmentPayment = typeof installmentPayments.$inferSelect;
export type NewInstallmentPayment = typeof installmentPayments.$inferInsert;
