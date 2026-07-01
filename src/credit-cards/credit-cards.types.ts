import { z } from 'zod';

import { CreditCardTransactionStatusSchema } from './credit-cards.schemas.js';

export const CreditCardTransactionResponseSchema = z.strictObject({
  id: z.uuid(),
  householdId: z.uuid(),
  amount: z.number().int(),
  transactionDate: z.iso.date(),
  categoryId: z.uuid().nullable(),
  paidByUserId: z.uuid().nullable(),
  createdByUserId: z.uuid(),
  note: z.string().nullable(),
  status: CreditCardTransactionStatusSchema,
  expectedPaymentDate: z.iso.date().nullable(),
  resolvedPaymentId: z.uuid().nullable(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const CreditCardPaymentResponseSchema = z.strictObject({
  id: z.uuid(),
  householdId: z.uuid(),
  creditCardTransactionId: z.uuid(),
  amount: z.number().int(),
  paymentDate: z.iso.date(),
  cashTransactionId: z.uuid(),
  createdByUserId: z.uuid(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type CreditCardTransactionStatus = z.infer<typeof CreditCardTransactionStatusSchema>;
export type CreditCardTransactionResponse = z.infer<typeof CreditCardTransactionResponseSchema>;
export type CreditCardPaymentResponse = z.infer<typeof CreditCardPaymentResponseSchema>;

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
