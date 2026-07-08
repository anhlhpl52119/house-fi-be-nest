import { z } from 'zod';

export const CreateHouseholdMemberRequestSchema = z.strictObject({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(120),
});

export const UpdateCurrentHouseholdRequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(160),
});

export type CreateHouseholdMemberRequest = z.infer<typeof CreateHouseholdMemberRequestSchema>;
export type UpdateCurrentHouseholdRequest = z.infer<typeof UpdateCurrentHouseholdRequestSchema>;
