import { z } from 'zod';

export const AssetTypeSchema = z.enum(['gold', 'stock', 'crypto']);
export const AssetTransactionTypeSchema = z.enum(['buy', 'sell']);

const OptionalStringParamSchema = (schema: z.ZodType<string>) =>
  z.preprocess((value) => {
    const normalized = Array.isArray(value) ? value[0] : value;
    return normalized === '' ? undefined : normalized;
  }, schema.optional());

const OptionalDateParamSchema = OptionalStringParamSchema(z.iso.date());
const OptionalUuidParamSchema = OptionalStringParamSchema(z.uuid());
const OptionalAssetTypeParamSchema = OptionalStringParamSchema(AssetTypeSchema);
const OptionalAssetTransactionTypeParamSchema = OptionalStringParamSchema(AssetTransactionTypeSchema);

const AmountSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const NameSchema = z.string().trim().min(1).max(160);
const UnitSchema = z.string().trim().min(1).max(40);
const SymbolSchema = z.string().trim().min(1).max(40);
const NoteSchema = z.string().trim().min(1).max(1000);
const DecimalQuantityPattern = /^\d{1,20}(?:\.\d{1,10})?$/;

export const QuantitySchema = z
  .string()
  .trim()
  .regex(DecimalQuantityPattern, 'quantity must be a decimal string with at most 20 integer digits and 10 fractional digits.')
  .superRefine((value, context) => {
    if (toScaledQuantity(value) <= 0n) {
      context.addIssue({
        code: 'custom',
        message: 'quantity must be greater than 0.',
      });
    }
  })
  .transform(normalizeQuantity);

export const ListAssetsQuerySchema = z.strictObject({
  type: OptionalAssetTypeParamSchema,
});

export const CreateAssetRequestSchema = z.strictObject({
  type: AssetTypeSchema,
  symbol: SymbolSchema.nullable().optional(),
  name: NameSchema,
  unit: UnitSchema,
});

export const AssetIdParamSchema = z.uuid();

export const ListAssetTransactionsQuerySchema = z
  .strictObject({
    assetId: OptionalUuidParamSchema,
    type: OptionalAssetTransactionTypeParamSchema,
    fromDate: OptionalDateParamSchema,
    toDate: OptionalDateParamSchema,
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

export const CreateAssetTransactionRequestSchema = z.strictObject({
  type: AssetTransactionTypeSchema,
  quantity: QuantitySchema,
  unitPrice: AmountSchema,
  totalAmount: AmountSchema,
  transactionDate: z.iso.date(),
  paidByUserId: z.uuid().nullable().optional(),
  note: NoteSchema.optional(),
});

export type ListAssetsQuery = z.infer<typeof ListAssetsQuerySchema>;
export type CreateAssetRequest = z.infer<typeof CreateAssetRequestSchema>;
export type ListAssetTransactionsQuery = z.infer<typeof ListAssetTransactionsQuerySchema>;
export type CreateAssetTransactionRequest = z.infer<typeof CreateAssetTransactionRequestSchema>;

function normalizeQuantity(value: string): string {
  const [wholePart = '0', fractionalPart = ''] = value.split('.');
  const normalizedWhole = wholePart.replace(/^0+(?=\d)/, '') || '0';
  const normalizedFractional = fractionalPart.replace(/0+$/, '');

  return normalizedFractional.length > 0 ? `${normalizedWhole}.${normalizedFractional}` : normalizedWhole;
}

function toScaledQuantity(value: string): bigint {
  if (!DecimalQuantityPattern.test(value)) {
    return 0n;
  }

  const [wholePart = '0', fractionalPart = ''] = value.split('.');
  return BigInt(wholePart) * 10_000_000_000n + BigInt(fractionalPart.padEnd(10, '0'));
}
