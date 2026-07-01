import { z } from 'zod';

import { CategoryTypeSchema } from './categories.schemas.js';

export const CategoryResponseSchema = z.strictObject({
  id: z.uuid(),
  householdId: z.uuid().nullable(),
  parentId: z.uuid().nullable(),
  name: z.string().min(1),
  type: CategoryTypeSchema,
  icon: z.string().nullable(),
  backgroundColor: z.string().nullable(),
  textColor: z.string().nullable(),
  borderColor: z.string().nullable(),
  description: z.string().nullable(),
  isSystem: z.boolean(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type CategoryType = z.infer<typeof CategoryTypeSchema>;
export type CategoryResponse = z.infer<typeof CategoryResponseSchema>;

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
