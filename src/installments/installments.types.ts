import { z } from 'zod';

import { InstallmentPaymentStatusSchema, InstallmentPlanStatusSchema } from './installments.schemas.js';

export const InstallmentPaymentResponseSchema = z.strictObject({
  id: z.uuid(),
  householdId: z.uuid(),
  installmentPlanId: z.uuid(),
  sequenceNo: z.number().int().positive(),
  amount: z.number().int().positive(),
  dueDate: z.iso.date(),
  status: InstallmentPaymentStatusSchema,
  paidDate: z.iso.date().nullable(),
  cashTransactionId: z.uuid().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const InstallmentPlanResponseSchema = z.strictObject({
  id: z.uuid(),
  householdId: z.uuid(),
  originalAmount: z.number().int().positive(),
  purchaseDate: z.iso.date(),
  categoryId: z.uuid().nullable(),
  paidByUserId: z.uuid().nullable(),
  createdByUserId: z.uuid(),
  note: z.string().nullable(),
  installmentCount: z.number().int().positive(),
  monthlyAmount: z.number().int().positive(),
  status: InstallmentPlanStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const InstallmentPlanDetailResponseSchema = InstallmentPlanResponseSchema.extend({
  payments: z.array(InstallmentPaymentResponseSchema),
});

export type InstallmentPlanStatus = z.infer<typeof InstallmentPlanStatusSchema>;
export type InstallmentPaymentStatus = z.infer<typeof InstallmentPaymentStatusSchema>;
export type InstallmentPaymentResponse = z.infer<typeof InstallmentPaymentResponseSchema>;
export type InstallmentPlanResponse = z.infer<typeof InstallmentPlanResponseSchema>;
export type InstallmentPlanDetailResponse = z.infer<typeof InstallmentPlanDetailResponseSchema>;

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
