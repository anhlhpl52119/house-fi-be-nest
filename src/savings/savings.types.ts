import { z } from 'zod';

import { SavingDepositStatusSchema } from './savings.schemas.js';

const NormalizedInterestRateSchema = z.string().regex(/^\d{1,4}(?:\.\d{1,4})?$/);

export const SavingDepositResponseSchema = z.strictObject({
  id: z.uuid(),
  householdId: z.uuid(),
  bankName: z.string().min(1),
  principalAmount: z.number().int().positive(),
  interestRate: NormalizedInterestRateSchema,
  startDate: z.iso.date(),
  maturityDate: z.iso.date(),
  termMonths: z.number().int().positive().nullable(),
  expectedInterestAmount: z.number().int().nonnegative().nullable(),
  actualInterestAmount: z.number().int().nonnegative().nullable(),
  status: SavingDepositStatusSchema,
  depositCashTransactionId: z.uuid(),
  maturityCashTransactionId: z.uuid().nullable(),
  paidByUserId: z.uuid().nullable(),
  createdByUserId: z.uuid(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type SavingDepositStatus = z.infer<typeof SavingDepositStatusSchema>;
export type SavingDepositResponse = z.infer<typeof SavingDepositResponseSchema>;

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
