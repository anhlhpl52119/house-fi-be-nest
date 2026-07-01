export type SpendingSource = 'manual_cash' | 'credit_card' | 'installment';
export type CashFlowSourceType =
  | 'manual'
  | 'asset_transaction'
  | 'saving_deposit'
  | 'saving_maturity'
  | 'credit_card_payment'
  | 'installment_payment'
  | null;
export type ObligationSource = 'credit_card' | 'installment';

export interface AmountBreakdown<TSource extends string> {
  source: TSource;
  amount: number;
}

export interface CategorySpendingBreakdown {
  categoryId: string | null;
  amount: number;
}

export interface MonthlySpendingReportResponse {
  month: string;
  currency: 'VND';
  totalAmount: number;
  bySource: Array<AmountBreakdown<SpendingSource>>;
  byCategory: CategorySpendingBreakdown[];
}

export interface CashFlowBreakdown {
  sourceType: CashFlowSourceType;
  incomeAmount: number;
  expenseAmount: number;
  netAmount: number;
}

export interface CashFlowReportResponse {
  from: string;
  to: string;
  currency: 'VND';
  incomeAmount: number;
  expenseAmount: number;
  netAmount: number;
  bySourceType: CashFlowBreakdown[];
}

export interface UpcomingObligationItemResponse {
  source: ObligationSource;
  id: string;
  amount: number;
  dueDate: string;
  paidByUserId: string | null;
  note: string | null;
}

export interface UpcomingObligationsReportResponse {
  from: string;
  to: string;
  currency: 'VND';
  totalAmount: number;
  items: UpcomingObligationItemResponse[];
  bySource: Array<AmountBreakdown<ObligationSource>>;
}

export interface AssetSummaryItemResponse {
  assetId: string;
  type: 'gold' | 'stock' | 'crypto';
  symbol: string | null;
  name: string;
  unit: string;
  currentQuantity: string;
  totalBuyQuantity: string;
  totalSellQuantity: string;
  totalBuyAmount: number;
  totalSellAmount: number;
}

export interface AssetSummaryReportResponse {
  currency: 'VND';
  assets: AssetSummaryItemResponse[];
  totalBuyAmount: number;
  totalSellAmount: number;
}

export interface UpcomingSavingMaturityResponse {
  id: string;
  bankName: string;
  principalAmount: number;
  expectedInterestAmount: number | null;
  maturityDate: string;
  paidByUserId: string | null;
}

export interface SavingsSummaryReportResponse {
  currency: 'VND';
  activePrincipalAmount: number;
  activeExpectedInterestAmount: number;
  maturedPrincipalAmount: number;
  maturedActualInterestAmount: number;
  upcomingMaturities: UpcomingSavingMaturityResponse[];
}

export interface CurrentHouseholdMembership {
  householdId: string;
  role: 'owner' | 'member';
}
