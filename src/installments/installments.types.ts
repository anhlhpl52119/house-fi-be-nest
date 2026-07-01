export type InstallmentPlanStatus = 'active' | 'completed' | 'cancelled';
export type InstallmentPaymentStatus = 'pending' | 'paid' | 'cancelled';

export interface InstallmentPaymentResponse {
  id: string;
  householdId: string;
  installmentPlanId: string;
  sequenceNo: number;
  amount: number;
  dueDate: string;
  status: InstallmentPaymentStatus;
  paidDate: string | null;
  cashTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPlanResponse {
  id: string;
  householdId: string;
  originalAmount: number;
  purchaseDate: string;
  categoryId: string | null;
  paidByUserId: string | null;
  createdByUserId: string;
  note: string | null;
  installmentCount: number;
  monthlyAmount: number;
  status: InstallmentPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPlanDetailResponse extends InstallmentPlanResponse {
  payments: InstallmentPaymentResponse[];
}

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
