export type CreditCardTransactionStatus = 'pending' | 'resolved' | 'cancelled';

export interface CreditCardTransactionResponse {
  id: string;
  householdId: string;
  amount: number;
  transactionDate: string;
  categoryId: string | null;
  paidByUserId: string | null;
  createdByUserId: string;
  note: string | null;
  status: CreditCardTransactionStatus;
  expectedPaymentDate: string | null;
  resolvedPaymentId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreditCardPaymentResponse {
  id: string;
  householdId: string;
  creditCardTransactionId: string;
  amount: number;
  paymentDate: string;
  cashTransactionId: string;
  createdByUserId: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
