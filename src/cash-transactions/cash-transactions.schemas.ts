import { z } from 'zod';

export const CashTransactionTypeSchema = z.enum(['income', 'expense']);
export const CashTransactionSourceTypeSchema = z.enum([
  'manual',
  'asset_transaction',
  'saving_deposit',
  'saving_maturity',
  'credit_card_payment',
  'installment_payment',
]);

const OptionalStringParamSchema = (schema: z.ZodType<string>) =>
  z.preprocess((value) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    return normalized === '' ? undefined : normalized;
  }, schema.optional());

const OptionalDateParamSchema = OptionalStringParamSchema(z.iso.date());
const OptionalUuidParamSchema = OptionalStringParamSchema(z.uuid());
const OptionalSourceTypeParamSchema = OptionalStringParamSchema(CashTransactionSourceTypeSchema);
const OptionalTypeParamSchema = OptionalStringParamSchema(CashTransactionTypeSchema);

const AmountSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const NoteSchema = z.string().trim().min(1).max(1000);

export const ListCashTransactionsQuerySchema = z
  .strictObject({
    type: OptionalTypeParamSchema,
    fromDate: OptionalDateParamSchema,
    toDate: OptionalDateParamSchema,
    categoryId: OptionalUuidParamSchema,
    paidByUserId: OptionalUuidParamSchema,
    sourceType: OptionalSourceTypeParamSchema,
  })
  .superRefine((value, context) => {
    if (value.fromDate && value.toDate && value.fromDate > value.toDate) {
      context.addIssue({
        code: 'custom',
        path: ['toDate'],
        message: 'toDate must be on or after fromDate.',
      });
    }
  });

export const CashTransactionIdParamSchema = z.uuid();

export const CreateCashTransactionRequestSchema = z.strictObject({
  type: CashTransactionTypeSchema,
  amount: AmountSchema,
  transactionDate: z.iso.date(),
  categoryId: z.uuid().nullable().optional(),
  paidByUserId: z.uuid().nullable().optional(),
  note: NoteSchema.optional(),
});

export const UpdateCashTransactionRequestSchema = z
  .strictObject({
    type: CashTransactionTypeSchema.optional(),
    amount: AmountSchema.optional(),
    transactionDate: z.iso.date().optional(),
    categoryId: z.uuid().nullable().optional(),
    paidByUserId: z.uuid().nullable().optional(),
    note: NoteSchema.nullable().optional(),
  })
  .superRefine((value, context) => {
    if (Object.keys(value).length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'At least one cash transaction field must be provided.',
      });
    }
  });

export type ListCashTransactionsQuery = z.infer<typeof ListCashTransactionsQuerySchema>;
export type CreateCashTransactionRequest = z.infer<typeof CreateCashTransactionRequestSchema>;
export type UpdateCashTransactionRequest = z.infer<typeof UpdateCashTransactionRequestSchema>;
