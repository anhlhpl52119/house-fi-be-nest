import { z } from 'zod';

export const CreateHouseholdMemberRequestSchema = z.strictObject({
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  displayName: z.string().trim().min(1).max(120),
});

export type CreateHouseholdMemberRequest = z.infer<typeof CreateHouseholdMemberRequestSchema>;
