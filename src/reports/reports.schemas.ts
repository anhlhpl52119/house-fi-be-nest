import { z } from 'zod';

const MonthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

const StringParamSchema = (schema: z.ZodType<string>) =>
  z.preprocess((value) => (Array.isArray(value) ? value[0] : value), schema);

const OptionalStringParamSchema = (schema: z.ZodType<string>) =>
  z.preprocess((value) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    return normalized === '' ? undefined : normalized;
  }, schema.optional());

const MonthParamSchema = StringParamSchema(z.string().regex(MonthPattern, 'month must use YYYY-MM format.'));
const DateParamSchema = StringParamSchema(z.iso.date());
const OptionalDateParamSchema = OptionalStringParamSchema(z.iso.date());
const OptionalUuidParamSchema = OptionalStringParamSchema(z.uuid());

export const MonthlySpendingQuerySchema = z.strictObject({
  month: MonthParamSchema,
  paidByUserId: OptionalUuidParamSchema,
});

export const CashFlowQuerySchema = z
  .strictObject({
    from: DateParamSchema,
    to: DateParamSchema,
  })
  .superRefine((value, context) => {
    if (value.from > value.to) {
      context.addIssue({
        code: 'custom',
        path: ['to'],
        message: 'to must be on or after from.',
      });
    }
  });

export const UpcomingObligationsQuerySchema = CashFlowQuerySchema;

export const SavingsSummaryQuerySchema = z
  .strictObject({
    maturityFrom: OptionalDateParamSchema,
    maturityTo: OptionalDateParamSchema,
  })
  .superRefine((value, context) => {
    if (value.maturityFrom && value.maturityTo && value.maturityFrom > value.maturityTo) {
      context.addIssue({
        code: 'custom',
        path: ['maturityTo'],
        message: 'maturityTo must be on or after maturityFrom.',
      });
    }
  });

export type MonthlySpendingQuery = z.infer<typeof MonthlySpendingQuerySchema>;
export type CashFlowQuery = z.infer<typeof CashFlowQuerySchema>;
export type UpcomingObligationsQuery = z.infer<typeof UpcomingObligationsQuerySchema>;
export type SavingsSummaryQuery = z.infer<typeof SavingsSummaryQuerySchema>;
