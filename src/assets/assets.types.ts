import { z } from 'zod';

import { AssetTransactionTypeSchema, AssetTypeSchema } from './assets.schemas.js';

const NormalizedQuantitySchema = z.string().regex(/^\d{1,20}(?:\.\d{1,10})?$/);

export const AssetResponseSchema = z.strictObject({
  id: z.uuid(),
  householdId: z.uuid(),
  type: AssetTypeSchema,
  symbol: z.string().nullable(),
  name: z.string().min(1),
  unit: z.string().min(1),
  currentQuantity: NormalizedQuantitySchema,
  isActive: z.boolean(),
  createdByUserId: z.uuid(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const AssetTransactionResponseSchema = z.strictObject({
  id: z.uuid(),
  householdId: z.uuid(),
  assetId: z.uuid(),
  type: AssetTransactionTypeSchema,
  quantity: NormalizedQuantitySchema,
  unitPrice: z.number().int().positive(),
  totalAmount: z.number().int().positive(),
  transactionDate: z.iso.date(),
  cashTransactionId: z.uuid().nullable(),
  paidByUserId: z.uuid().nullable(),
  createdByUserId: z.uuid(),
  note: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type AssetType = z.infer<typeof AssetTypeSchema>;
export type AssetTransactionType = z.infer<typeof AssetTransactionTypeSchema>;
export type AssetResponse = z.infer<typeof AssetResponseSchema>;
export type AssetTransactionResponse = z.infer<typeof AssetTransactionResponseSchema>;

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
