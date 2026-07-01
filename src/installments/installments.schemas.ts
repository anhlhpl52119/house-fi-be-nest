import { z } from 'zod';

export const InstallmentPlanStatusSchema = z.enum(['active', 'completed', 'cancelled']);
export const InstallmentPaymentStatusSchema = z.enum(['pending', 'paid', 'cancelled']);

const OptionalStringParamSchema = (schema: z.ZodType<string>) =>
  z.preprocess((value) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    return normalized === '' ? undefined : normalized;
  }, schema.optional());

const OptionalDateParamSchema = OptionalStringParamSchema(z.iso.date());
const OptionalUuidParamSchema = OptionalStringParamSchema(z.uuid());
const OptionalPlanStatusParamSchema = OptionalStringParamSchema(InstallmentPlanStatusSchema);
const AmountSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const PositiveIntegerSchema = z.number().int().positive().max(2_147_483_647);
const NoteSchema = z.string().trim().min(1).max(1000);

export const ListInstallmentPlansQuerySchema = z
  .strictObject({
    status: OptionalPlanStatusParamSchema,
    fromDate: OptionalDateParamSchema,
    toDate: OptionalDateParamSchema,
    categoryId: OptionalUuidParamSchema,
    paidByUserId: OptionalUuidParamSchema,
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

export const InstallmentPlanIdParamSchema = z.uuid();
export const InstallmentPaymentIdParamSchema = z.uuid();

export const CreateInstallmentPlanRequestSchema = z
  .strictObject({
    originalAmount: AmountSchema,
    purchaseDate: z.iso.date(),
    categoryId: z.uuid().nullable().optional(),
    paidByUserId: z.uuid().nullable().optional(),
    installmentCount: PositiveIntegerSchema,
    monthlyAmount: AmountSchema,
    firstDueDate: z.iso.date(),
    note: NoteSchema.optional(),
  })
  .superRefine((value, context) => {
    if (value.firstDueDate < value.purchaseDate) {
      context.addIssue({
        code: 'custom',
        path: ['firstDueDate'],
        message: 'firstDueDate must be on or after purchaseDate.',
      });
    }
  });

export const ListUpcomingInstallmentPaymentsQuerySchema = z
  .strictObject({
    installmentPlanId: OptionalUuidParamSchema,
    dueFrom: OptionalDateParamSchema,
    dueTo: OptionalDateParamSchema,
  })
  .superRefine((value, context) => {
    if (value.dueFrom && value.dueTo && value.dueFrom > value.dueTo) {
      context.addIssue({
        code: 'custom',
        path: ['dueTo'],
        message: 'dueTo must be on or after dueFrom.',
      });
    }
  });

export const PayInstallmentPaymentRequestSchema = z.strictObject({
  paidDate: z.iso.date(),
  amount: AmountSchema,
  note: NoteSchema.optional(),
});

export type ListInstallmentPlansQuery = z.infer<typeof ListInstallmentPlansQuerySchema>;
export type CreateInstallmentPlanRequest = z.infer<typeof CreateInstallmentPlanRequestSchema>;
export type ListUpcomingInstallmentPaymentsQuery = z.infer<typeof ListUpcomingInstallmentPaymentsQuerySchema>;
export type PayInstallmentPaymentRequest = z.infer<typeof PayInstallmentPaymentRequestSchema>;
