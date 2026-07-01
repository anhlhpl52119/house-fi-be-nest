export interface HouseholdMemberUserResponse {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface HouseholdMemberResponse {
  id: string;
  role: 'owner' | 'member';
  joinedAt: string;
  user: HouseholdMemberUserResponse;
}

export interface CurrentHouseholdMembership {
  householdId: string;
  householdName: string;
  role: 'owner' | 'member';
}
