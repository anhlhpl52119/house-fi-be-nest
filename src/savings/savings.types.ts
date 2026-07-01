export type SavingDepositStatus = 'active' | 'matured' | 'withdrawn' | 'cancelled';

export interface SavingDepositResponse {
  id: string;
  householdId: string;
  bankName: string;
  principalAmount: number;
  interestRate: string;
  startDate: string;
  maturityDate: string;
  termMonths: number | null;
  expectedInterestAmount: number | null;
  actualInterestAmount: number | null;
  status: SavingDepositStatus;
  depositCashTransactionId: string;
  maturityCashTransactionId: string | null;
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
