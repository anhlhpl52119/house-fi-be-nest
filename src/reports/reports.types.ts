import { z } from 'zod';

export const SpendingSourceSchema = z.enum(['manual_cash', 'credit_card', 'installment']);
export const CashFlowSourceTypeSchema = z.enum([
  'manual',
  'asset_transaction',
  'saving_deposit',
  'saving_maturity',
  'credit_card_payment',
  'installment_payment',
]);
export const ObligationSourceSchema = z.enum(['credit_card', 'installment']);

export const AmountBreakdownSchema = <TSchema extends z.ZodType<string>>(sourceSchema: TSchema) =>
  z.strictObject({
    source: sourceSchema,
    amount: z.number().int(),
  });

export const CategorySpendingBreakdownSchema = z.strictObject({
  categoryId: z.uuid().nullable(),
  amount: z.number().int(),
});

export const MonthlySpendingReportResponseSchema = z.strictObject({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  currency: z.literal('VND'),
  totalAmount: z.number().int(),
  bySource: z.array(AmountBreakdownSchema(SpendingSourceSchema)),
  byCategory: z.array(CategorySpendingBreakdownSchema),
});

export const CashFlowBreakdownSchema = z.strictObject({
  sourceType: CashFlowSourceTypeSchema.nullable(),
  incomeAmount: z.number().int(),
  expenseAmount: z.number().int(),
  netAmount: z.number().int(),
});

export const CashFlowReportResponseSchema = z.strictObject({
  from: z.iso.date(),
  to: z.iso.date(),
  currency: z.literal('VND'),
  incomeAmount: z.number().int(),
  expenseAmount: z.number().int(),
  netAmount: z.number().int(),
  bySourceType: z.array(CashFlowBreakdownSchema),
});

export const UpcomingObligationItemResponseSchema = z.strictObject({
  source: ObligationSourceSchema,
  id: z.uuid(),
  amount: z.number().int(),
  dueDate: z.iso.date(),
  paidByUserId: z.uuid().nullable(),
  note: z.string().nullable(),
});

export const UpcomingObligationsReportResponseSchema = z.strictObject({
  from: z.iso.date(),
  to: z.iso.date(),
  currency: z.literal('VND'),
  totalAmount: z.number().int(),
  items: z.array(UpcomingObligationItemResponseSchema),
  bySource: z.array(AmountBreakdownSchema(ObligationSourceSchema)),
});

export const AssetSummaryItemResponseSchema = z.strictObject({
  assetId: z.uuid(),
  type: z.enum(['gold', 'stock', 'crypto']),
  symbol: z.string().nullable(),
  name: z.string().min(1),
  unit: z.string().min(1),
  currentQuantity: z.string().min(1),
  totalBuyQuantity: z.string().min(1),
  totalSellQuantity: z.string().min(1),
  totalBuyAmount: z.number().int(),
  totalSellAmount: z.number().int(),
});

export const AssetSummaryReportResponseSchema = z.strictObject({
  currency: z.literal('VND'),
  assets: z.array(AssetSummaryItemResponseSchema),
  totalBuyAmount: z.number().int(),
  totalSellAmount: z.number().int(),
});

export const UpcomingSavingMaturityResponseSchema = z.strictObject({
  id: z.uuid(),
  bankName: z.string().min(1),
  principalAmount: z.number().int().positive(),
  expectedInterestAmount: z.number().int().nonnegative().nullable(),
  maturityDate: z.iso.date(),
  paidByUserId: z.uuid().nullable(),
});

export const SavingsSummaryReportResponseSchema = z.strictObject({
  currency: z.literal('VND'),
  activePrincipalAmount: z.number().int().nonnegative(),
  activeExpectedInterestAmount: z.number().int().nonnegative(),
  maturedPrincipalAmount: z.number().int().nonnegative(),
  maturedActualInterestAmount: z.number().int().nonnegative(),
  upcomingMaturities: z.array(UpcomingSavingMaturityResponseSchema),
});

export type SpendingSource = z.infer<typeof SpendingSourceSchema>;
export type CashFlowSourceType = z.infer<typeof CashFlowSourceTypeSchema> | null;
export type ObligationSource = z.infer<typeof ObligationSourceSchema>;
export type AmountBreakdown<TSource extends string> = {
  source: TSource;
  amount: number;
};
export type CategorySpendingBreakdown = z.infer<typeof CategorySpendingBreakdownSchema>;
export type MonthlySpendingReportResponse = z.infer<typeof MonthlySpendingReportResponseSchema>;
export type CashFlowBreakdown = z.infer<typeof CashFlowBreakdownSchema>;
export type CashFlowReportResponse = z.infer<typeof CashFlowReportResponseSchema>;
export type UpcomingObligationItemResponse = z.infer<typeof UpcomingObligationItemResponseSchema>;
export type UpcomingObligationsReportResponse = z.infer<typeof UpcomingObligationsReportResponseSchema>;
export type AssetSummaryItemResponse = z.infer<typeof AssetSummaryItemResponseSchema>;
export type AssetSummaryReportResponse = z.infer<typeof AssetSummaryReportResponseSchema>;
export type UpcomingSavingMaturityResponse = z.infer<typeof UpcomingSavingMaturityResponseSchema>;
export type SavingsSummaryReportResponse = z.infer<typeof SavingsSummaryReportResponseSchema>;

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
