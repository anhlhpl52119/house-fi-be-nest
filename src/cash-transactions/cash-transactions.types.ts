export type CashTransactionType = 'income' | 'expense';

export type CashTransactionSourceType =
  | 'manual'
  | 'asset_transaction'
  | 'saving_deposit'
  | 'saving_maturity'
  | 'credit_card_payment'
  | 'installment_payment';

export interface CashTransactionResponse {
  id: string;
  householdId: string;
  type: CashTransactionType;
  amount: number;
  transactionDate: string;
  categoryId: string | null;
  paidByUserId: string | null;
  createdByUserId: string;
  note: string | null;
  sourceType: CashTransactionSourceType | null;
  sourceId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashBalanceResponse {
  currency: 'VND';
  incomeAmount: number;
  expenseAmount: number;
  balance: number;
}

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
