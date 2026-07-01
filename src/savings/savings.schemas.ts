import { z } from 'zod';

export const SavingDepositStatusSchema = z.enum(['active', 'matured', 'withdrawn', 'cancelled']);

const OptionalStringParamSchema = (schema: z.ZodType<string>) =>
  z.preprocess((value) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    return normalized === '' ? undefined : normalized;
  }, schema.optional());

const OptionalDateParamSchema = OptionalStringParamSchema(z.iso.date());
const OptionalUuidParamSchema = OptionalStringParamSchema(z.uuid());
const OptionalStatusParamSchema = OptionalStringParamSchema(SavingDepositStatusSchema);
const PositiveAmountSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const NonNegativeAmountSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const PositiveIntegerSchema = z.number().int().positive().max(2_147_483_647);
const BankNameSchema = z.string().trim().min(1).max(160);
const NoteSchema = z.string().trim().min(1).max(1000);
const InterestRatePattern = /^\d{1,4}(?:\.\d{1,4})?$/;

export const InterestRateSchema = z
  .string()
  .trim()
  .regex(InterestRatePattern, 'interestRate must be a decimal string from 0 to 9999.9999 with at most 4 fractional digits.')
  .transform(normalizeDecimal);

export const ListSavingDepositsQuerySchema = z
  .strictObject({
    status: OptionalStatusParamSchema,
    startFrom: OptionalDateParamSchema,
    startTo: OptionalDateParamSchema,
    maturityFrom: OptionalDateParamSchema,
    maturityTo: OptionalDateParamSchema,
    paidByUserId: OptionalUuidParamSchema,
  })
  .superRefine((value, context) => {
    if (value.startFrom && value.startTo && value.startFrom > value.startTo) {
      context.addIssue({
        code: 'custom',
        path: ['startTo'],
        message: 'startTo must be on or after startFrom.',
      });
    }

    if (value.maturityFrom && value.maturityTo && value.maturityFrom > value.maturityTo) {
      context.addIssue({
        code: 'custom',
        path: ['maturityTo'],
        message: 'maturityTo must be on or after maturityFrom.',
      });
    }
  });

export const SavingDepositIdParamSchema = z.uuid();

export const CreateSavingDepositRequestSchema = z
  .strictObject({
    bankName: BankNameSchema,
    principalAmount: PositiveAmountSchema,
    interestRate: InterestRateSchema,
    startDate: z.iso.date(),
    maturityDate: z.iso.date(),
    termMonths: PositiveIntegerSchema.optional(),
    expectedInterestAmount: NonNegativeAmountSchema.optional(),
    paidByUserId: z.uuid().nullable().optional(),
    note: NoteSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.maturityDate < value.startDate) {
      context.addIssue({
        code: 'custom',
        path: ['maturityDate'],
        message: 'maturityDate must be on or after startDate.',
      });
    }
  });

export const MatureSavingDepositRequestSchema = z.strictObject({
  maturityDate: z.iso.date(),
  actualInterestAmount: NonNegativeAmountSchema,
  note: NoteSchema.optional(),
});

export type ListSavingDepositsQuery = z.infer<typeof ListSavingDepositsQuerySchema>;
export type CreateSavingDepositRequest = z.infer<typeof CreateSavingDepositRequestSchema>;
export type MatureSavingDepositRequest = z.infer<typeof MatureSavingDepositRequestSchema>;

function normalizeDecimal(value: string): string {
  const [wholePart = '0', fractionalPart = ''] = value.split('.');
  const normalizedWhole = wholePart.replace(/^0+(?=\d)/, '') || '0';
  const normalizedFractional = fractionalPart.replace(/0+$/, '');

  return normalizedFractional.length > 0 ? `${normalizedWhole}.${normalizedFractional}` : normalizedWhole;
}
