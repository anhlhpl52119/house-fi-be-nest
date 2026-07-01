export type AssetType = 'gold' | 'stock' | 'crypto';
export type AssetTransactionType = 'buy' | 'sell';

export interface AssetResponse {
  id: string;
  householdId: string;
  type: AssetType;
  symbol: string | null;
  name: string;
  unit: string;
  currentQuantity: string;
  isActive: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetTransactionResponse {
  id: string;
  householdId: string;
  assetId: string;
  type: AssetTransactionType;
  quantity: string;
  unitPrice: number;
  totalAmount: number;
  transactionDate: string;
  cashTransactionId: string | null;
  paidByUserId: string | null;
  createdByUserId: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
