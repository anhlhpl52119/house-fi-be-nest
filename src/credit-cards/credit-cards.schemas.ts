import { z } from 'zod';

export const CreditCardTransactionStatusSchema = z.enum(['pending', 'resolved', 'cancelled']);

const OptionalStringParamSchema = (schema: z.ZodType<string>) =>
  z.preprocess((value) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    return normalized === '' ? undefined : normalized;
  }, schema.optional());

const OptionalDateParamSchema = OptionalStringParamSchema(z.iso.date());
const OptionalUuidParamSchema = OptionalStringParamSchema(z.uuid());
const OptionalStatusParamSchema = OptionalStringParamSchema(CreditCardTransactionStatusSchema);
const AmountSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const NoteSchema = z.string().trim().min(1).max(1000);

export const ListCreditCardTransactionsQuerySchema = z
  .strictObject({
    status: OptionalStatusParamSchema,
    fromDate: OptionalDateParamSchema,
    toDate: OptionalDateParamSchema,
    categoryId: OptionalUuidParamSchema,
    paidByUserId: OptionalUuidParamSchema,
    expectedPaymentFrom: OptionalDateParamSchema,
    expectedPaymentTo: OptionalDateParamSchema,
  })
  .superRefine((value, context) => {
    if (value.fromDate && value.toDate && value.fromDate > value.toDate) {
      context.addIssue({
        code: 'custom',
        path: ['toDate'],
        message: 'toDate must be on or after fromDate.',
      });
    }

    if (
      value.expectedPaymentFrom &&
      value.expectedPaymentTo &&
      value.expectedPaymentFrom > value.expectedPaymentTo
    ) {
      context.addIssue({
        code: 'custom',
        path: ['expectedPaymentTo'],
        message: 'expectedPaymentTo must be on or after expectedPaymentFrom.',
      });
    }
  });

export const CreditCardTransactionIdParamSchema = z.uuid();

export const CreateCreditCardTransactionRequestSchema = z
  .strictObject({
    amount: AmountSchema,
    transactionDate: z.iso.date(),
    categoryId: z.uuid().nullable().optional(),
    paidByUserId: z.uuid().nullable().optional(),
    expectedPaymentDate: z.iso.date().nullable().optional(),
    note: NoteSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.expectedPaymentDate && value.expectedPaymentDate < value.transactionDate) {
      context.addIssue({
        code: 'custom',
        path: ['expectedPaymentDate'],
        message: 'expectedPaymentDate must be on or after transactionDate.',
      });
    }
  });

export const ResolveCreditCardTransactionRequestSchema = z.strictObject({
  paymentDate: z.iso.date(),
  note: NoteSchema.optional(),
});

export const ListCreditCardPaymentsQuerySchema = z
  .strictObject({
    creditCardTransactionId: OptionalUuidParamSchema,
    fromDate: OptionalDateParamSchema,
    toDate: OptionalDateParamSchema,
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

export type ListCreditCardTransactionsQuery = z.infer<typeof ListCreditCardTransactionsQuerySchema>;
export type CreateCreditCardTransactionRequest = z.infer<typeof CreateCreditCardTransactionRequestSchema>;
export type ResolveCreditCardTransactionRequest = z.infer<typeof ResolveCreditCardTransactionRequestSchema>;
export type ListCreditCardPaymentsQuery = z.infer<typeof ListCreditCardPaymentsQuerySchema>;
