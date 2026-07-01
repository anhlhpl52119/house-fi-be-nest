import { z } from 'zod';

export const HouseholdMemberUserResponseSchema = z.strictObject({
  id: z.uuid(),
  email: z.email(),
  displayName: z.string().min(1),
  avatarUrl: z.string().nullable(),
});

export const HouseholdMemberResponseSchema = z.strictObject({
  id: z.uuid(),
  role: z.enum(['owner', 'member']),
  joinedAt: z.string().min(1),
  user: HouseholdMemberUserResponseSchema,
});

export const CurrentHouseholdResponseSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
  role: z.enum(['owner', 'member']),
});

export type HouseholdMemberUserResponse = z.infer<typeof HouseholdMemberUserResponseSchema>;
export type HouseholdMemberResponse = z.infer<typeof HouseholdMemberResponseSchema>;
export type CurrentHouseholdResponse = z.infer<typeof CurrentHouseholdResponseSchema>;

export interface CurrentHouseholdMembership {
  householdId: string;
  householdName: string;
  role: 'owner' | 'member';
}
