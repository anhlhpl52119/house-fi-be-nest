export type CategoryType = 'income' | 'expense';

export interface CategoryResponse {
  id: string;
  householdId: string | null;
  parentId: string | null;
  name: string;
  type: CategoryType;
  icon: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  borderColor: string | null;
  description: string | null;
  isSystem: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
