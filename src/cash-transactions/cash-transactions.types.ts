import { z } from 'zod';

import { CashTransactionSourceTypeSchema, CashTransactionTypeSchema } from './cash-transactions.schemas.js';

export const CashTransactionResponseSchema = z.strictObject({
  id: z.uuid(),
  householdId: z.uuid(),
  type: CashTransactionTypeSchema,
  amount: z.number().int(),
  transactionDate: z.iso.date(),
  categoryId: z.uuid().nullable(),
  paidByUserId: z.uuid().nullable(),
  createdByUserId: z.uuid(),
  note: z.string().nullable(),
  sourceType: CashTransactionSourceTypeSchema.nullable(),
  sourceId: z.uuid().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const CashBalanceResponseSchema = z.strictObject({
  currency: z.literal('VND'),
  incomeAmount: z.number().int(),
  expenseAmount: z.number().int(),
  balance: z.number().int(),
});

export type CashTransactionType = z.infer<typeof CashTransactionTypeSchema>;
export type CashTransactionSourceType = z.infer<typeof CashTransactionSourceTypeSchema>;
export type CashTransactionResponse = z.infer<typeof CashTransactionResponseSchema>;
export type CashBalanceResponse = z.infer<typeof CashBalanceResponseSchema>;

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
