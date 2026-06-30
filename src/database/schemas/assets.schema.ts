import { sql } from 'drizzle-orm';
import { bigint, boolean, check, date, index, numeric, pgTable, text, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { timestamps, uuidPrimaryKey } from './_helpers.js';
import { cashTransactions } from './cash-transactions.schema.js';
import { households } from './households.schema.js';
import { users } from './users.schema.js';

export const assets = pgTable(
  'assets',
  {
    id: uuidPrimaryKey(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id),
    type: varchar('type', { length: 20 }).notNull(),
    symbol: varchar('symbol', { length: 40 }),
    name: varchar('name', { length: 160 }).notNull(),
    unit: varchar('unit', { length: 40 }).notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    ...timestamps(),
  },
  (table) => [
    check('assets_type_check', sql`${table.type} in ('gold', 'stock', 'crypto')`),
  ],
);

export const assetTransactions = pgTable(
  'asset_transactions',
  {
    id: uuidPrimaryKey(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id),
    assetId: uuid('asset_id')
      .notNull()
      .references(() => assets.id),
    type: varchar('type', { length: 20 }).notNull(),
    quantity: numeric('quantity', { precision: 30, scale: 10 }).notNull(),
    unitPrice: bigint('unit_price', { mode: 'bigint' }).notNull(),
    totalAmount: bigint('total_amount', { mode: 'bigint' }).notNull(),
    transactionDate: date('transaction_date', { mode: 'string' }).notNull(),
    cashTransactionId: uuid('cash_transaction_id').references(() => cashTransactions.id),
    paidByUserId: uuid('paid_by_user_id').references(() => users.id),
    createdByUserId: uuid('created_by_user_id')
      .notNull()
      .references(() => users.id),
    note: text('note'),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex('asset_transactions_cash_transaction_unique').on(table.cashTransactionId),
    index('asset_transactions_household_asset_date_idx').on(
      table.householdId,
      table.assetId,
      table.transactionDate,
    ),
    check('asset_transactions_type_check', sql`${table.type} in ('buy', 'sell')`),
    check('asset_transactions_quantity_check', sql`${table.quantity} > 0`),
    check('asset_transactions_unit_price_check', sql`${table.unitPrice} >= 0`),
    check('asset_transactions_total_amount_check', sql`${table.totalAmount} > 0`),
  ],
);

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type AssetTransaction = typeof assetTransactions.$inferSelect;
export type NewAssetTransaction = typeof assetTransactions.$inferInsert;
