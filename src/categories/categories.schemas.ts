import { z } from 'zod';

export const CategoryTypeSchema = z.enum(['income', 'expense']);

const HexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #EFF6FF.');

const OptionalTextSchema = z.string().trim().min(1).max(1000);
const IconSchema = z.string().trim().min(1).max(80);
const NameSchema = z.string().trim().min(1).max(120);
const SortOrderSchema = z.number().int().min(0).max(100_000);

export const ListCategoriesQuerySchema = z.strictObject({
  type: z.preprocess((value) => (Array.isArray(value) ? value[0] : value), CategoryTypeSchema.optional()),
});

export const CategoryIdParamSchema = z.uuid();

export const CreateCategoryRequestSchema = z.strictObject({
  name: NameSchema,
  type: CategoryTypeSchema,
  parentId: z.uuid().nullable().optional(),
  icon: IconSchema.optional(),
  backgroundColor: HexColorSchema.optional(),
  textColor: HexColorSchema.optional(),
  borderColor: HexColorSchema.optional(),
  description: OptionalTextSchema.optional(),
  sortOrder: SortOrderSchema.optional(),
});

export const UpdateCategoryRequestSchema = z
  .strictObject({
    name: NameSchema.optional(),
    type: CategoryTypeSchema.optional(),
    parentId: z.uuid().nullable().optional(),
    icon: IconSchema.nullable().optional(),
    backgroundColor: HexColorSchema.nullable().optional(),
    textColor: HexColorSchema.nullable().optional(),
    borderColor: HexColorSchema.nullable().optional(),
    description: OptionalTextSchema.nullable().optional(),
    sortOrder: SortOrderSchema.optional(),
  })
  .superRefine((value, context) => {
    if (Object.keys(value).length === 0) {
      context.addIssue({
        code: 'custom',
        message: 'At least one category field must be provided.',
      });
    }
  });

export type ListCategoriesQuery = z.infer<typeof ListCategoriesQuerySchema>;
export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;
export type UpdateCategoryRequest = z.infer<typeof UpdateCategoryRequestSchema>;
