import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { and, asc, eq, gte, isNull, lte, ne, or } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import { Database } from '../database/database.types.js';
import {
  assetTransactions,
  assets,
  cashTransactions,
  creditCardTransactions,
  householdMembers,
  households,
  installmentPayments,
  installmentPlans,
  savingDeposits,
} from '../database/schema.js';
import { CashFlowQuery, MonthlySpendingQuery, SavingsSummaryQuery, UpcomingObligationsQuery } from './reports.schemas.js';
import {
  AssetSummaryReportResponse,
  CashFlowBreakdown,
  CashFlowReportResponse,
  CashFlowSourceType,
  CurrentHouseholdMembership,
  MonthlySpendingReportResponse,
  ObligationSource,
  SavingsSummaryReportResponse,
  SpendingSource,
  UpcomingObligationItemResponse,
  UpcomingObligationsReportResponse,
} from './reports.types.js';

const QUANTITY_SCALE = 10_000_000_000n;

@Injectable()
export class ReportsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getMonthlySpending(
    requesterUserId: string,
    query: MonthlySpendingQuery,
  ): Promise<MonthlySpendingReportResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const { from, to } = this.monthBounds(query.month);

    const cashConditions = [
      eq(cashTransactions.householdId, membership.householdId),
      eq(cashTransactions.isActive, true),
      eq(cashTransactions.type, 'expense'),
      gte(cashTransactions.transactionDate, from),
      lte(cashTransactions.transactionDate, to),
      or(eq(cashTransactions.sourceType, 'manual'), isNull(cashTransactions.sourceType)),
    ];
    const creditCardConditions = [
      eq(creditCardTransactions.householdId, membership.householdId),
      ne(creditCardTransactions.status, 'cancelled'),
      gte(creditCardTransactions.transactionDate, from),
      lte(creditCardTransactions.transactionDate, to),
    ];
    const installmentConditions = [
      eq(installmentPlans.householdId, membership.householdId),
      ne(installmentPlans.status, 'cancelled'),
      gte(installmentPlans.purchaseDate, from),
      lte(installmentPlans.purchaseDate, to),
    ];

    if (query.paidByUserId) {
      cashConditions.push(eq(cashTransactions.paidByUserId, query.paidByUserId));
      creditCardConditions.push(eq(creditCardTransactions.paidByUserId, query.paidByUserId));
      installmentConditions.push(eq(installmentPlans.paidByUserId, query.paidByUserId));
    }

    const [cashRows, creditCardRows, installmentRows] = await Promise.all([
      this.db
        .select({ amount: cashTransactions.amount, categoryId: cashTransactions.categoryId })
        .from(cashTransactions)
        .where(and(...cashConditions)),
      this.db
        .select({ amount: creditCardTransactions.amount, categoryId: creditCardTransactions.categoryId })
        .from(creditCardTransactions)
        .where(and(...creditCardConditions)),
      this.db
        .select({ amount: installmentPlans.originalAmount, categoryId: installmentPlans.categoryId })
        .from(installmentPlans)
        .where(and(...installmentConditions)),
    ]);

    const sourceTotals = new Map<SpendingSource, bigint>([
      ['manual_cash', 0n],
      ['credit_card', 0n],
      ['installment', 0n],
    ]);
    const categoryTotals = new Map<string, bigint>();

    for (const row of cashRows) {
      this.addAmount(sourceTotals, 'manual_cash', row.amount);
      this.addCategoryAmount(categoryTotals, row.categoryId, row.amount);
    }

    for (const row of creditCardRows) {
      this.addAmount(sourceTotals, 'credit_card', row.amount);
      this.addCategoryAmount(categoryTotals, row.categoryId, row.amount);
    }

    for (const row of installmentRows) {
      this.addAmount(sourceTotals, 'installment', row.amount);
      this.addCategoryAmount(categoryTotals, row.categoryId, row.amount);
    }

    const totalAmount = [...sourceTotals.values()].reduce((total, amount) => total + amount, 0n);

    return {
      month: query.month,
      currency: 'VND',
      totalAmount: this.toSafeNumber(totalAmount),
      bySource: [...sourceTotals.entries()].map(([source, amount]) => ({ source, amount: this.toSafeNumber(amount) })),
      byCategory: [...categoryTotals.entries()].map(([categoryKey, amount]) => ({
        categoryId: this.fromCategoryKey(categoryKey),
        amount: this.toSafeNumber(amount),
      })),
    };
  }

  async getCashFlow(requesterUserId: string, query: CashFlowQuery): Promise<CashFlowReportResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const rows = await this.db
      .select({ type: cashTransactions.type, amount: cashTransactions.amount, sourceType: cashTransactions.sourceType })
      .from(cashTransactions)
      .where(
        and(
          eq(cashTransactions.householdId, membership.householdId),
          eq(cashTransactions.isActive, true),
          gte(cashTransactions.transactionDate, query.from),
          lte(cashTransactions.transactionDate, query.to),
        ),
      );

    let incomeAmount = 0n;
    let expenseAmount = 0n;
    const breakdown = new Map<string, { sourceType: CashFlowSourceType; incomeAmount: bigint; expenseAmount: bigint }>();

    for (const row of rows) {
      const sourceType = this.toCashFlowSourceType(row.sourceType);
      const key = this.cashFlowSourceKey(sourceType);
      const current = breakdown.get(key) ?? { sourceType, incomeAmount: 0n, expenseAmount: 0n };

      if (row.type === 'income') {
        incomeAmount += row.amount;
        current.incomeAmount += row.amount;
      } else if (row.type === 'expense') {
        expenseAmount += row.amount;
        current.expenseAmount += row.amount;
      }

      breakdown.set(key, current);
    }

    return {
      from: query.from,
      to: query.to,
      currency: 'VND',
      incomeAmount: this.toSafeNumber(incomeAmount),
      expenseAmount: this.toSafeNumber(expenseAmount),
      netAmount: this.toSafeNumber(incomeAmount - expenseAmount),
      bySourceType: [...breakdown.values()].map((item): CashFlowBreakdown => ({
        sourceType: item.sourceType,
        incomeAmount: this.toSafeNumber(item.incomeAmount),
        expenseAmount: this.toSafeNumber(item.expenseAmount),
        netAmount: this.toSafeNumber(item.incomeAmount - item.expenseAmount),
      })),
    };
  }

  async getUpcomingObligations(
    requesterUserId: string,
    query: UpcomingObligationsQuery,
  ): Promise<UpcomingObligationsReportResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const [creditCardRows, installmentRows] = await Promise.all([
      this.db
        .select({
          id: creditCardTransactions.id,
          amount: creditCardTransactions.amount,
          dueDate: creditCardTransactions.expectedPaymentDate,
          paidByUserId: creditCardTransactions.paidByUserId,
          note: creditCardTransactions.note,
        })
        .from(creditCardTransactions)
        .where(
          and(
            eq(creditCardTransactions.householdId, membership.householdId),
            eq(creditCardTransactions.status, 'pending'),
            gte(creditCardTransactions.expectedPaymentDate, query.from),
            lte(creditCardTransactions.expectedPaymentDate, query.to),
          ),
        ),
      this.db
        .select({
          id: installmentPayments.id,
          amount: installmentPayments.amount,
          dueDate: installmentPayments.dueDate,
          paidByUserId: installmentPlans.paidByUserId,
          note: installmentPlans.note,
        })
        .from(installmentPayments)
        .innerJoin(installmentPlans, eq(installmentPayments.installmentPlanId, installmentPlans.id))
        .where(
          and(
            eq(installmentPayments.householdId, membership.householdId),
            eq(installmentPayments.status, 'pending'),
            gte(installmentPayments.dueDate, query.from),
            lte(installmentPayments.dueDate, query.to),
          ),
        ),
    ]);

    const items: UpcomingObligationItemResponse[] = [];
    const sourceTotals = new Map<ObligationSource, bigint>([
      ['credit_card', 0n],
      ['installment', 0n],
    ]);

    for (const row of creditCardRows) {
      if (!row.dueDate) {
        continue;
      }

      this.addAmount(sourceTotals, 'credit_card', row.amount);
      items.push({
        source: 'credit_card',
        id: row.id,
        amount: this.toSafeNumber(row.amount),
        dueDate: row.dueDate,
        paidByUserId: row.paidByUserId,
        note: row.note,
      });
    }

    for (const row of installmentRows) {
      this.addAmount(sourceTotals, 'installment', row.amount);
      items.push({
        source: 'installment',
        id: row.id,
        amount: this.toSafeNumber(row.amount),
        dueDate: row.dueDate,
        paidByUserId: row.paidByUserId,
        note: row.note,
      });
    }

    items.sort((left, right) => left.dueDate.localeCompare(right.dueDate));
    const totalAmount = [...sourceTotals.values()].reduce((total, amount) => total + amount, 0n);

    return {
      from: query.from,
      to: query.to,
      currency: 'VND',
      totalAmount: this.toSafeNumber(totalAmount),
      items,
      bySource: [...sourceTotals.entries()].map(([source, amount]) => ({ source, amount: this.toSafeNumber(amount) })),
    };
  }

  async getAssetSummary(requesterUserId: string): Promise<AssetSummaryReportResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const [assetRows, transactionRows] = await Promise.all([
      this.db
        .select()
        .from(assets)
        .where(and(eq(assets.householdId, membership.householdId), eq(assets.isActive, true)))
        .orderBy(assets.type, assets.name),
      this.db
        .select()
        .from(assetTransactions)
        .where(eq(assetTransactions.householdId, membership.householdId)),
    ]);

    const totalsByAssetId = new Map<
      string,
      { buyQuantity: bigint; sellQuantity: bigint; buyAmount: bigint; sellAmount: bigint }
    >();

    for (const row of transactionRows) {
      const current = totalsByAssetId.get(row.assetId) ?? {
        buyQuantity: 0n,
        sellQuantity: 0n,
        buyAmount: 0n,
        sellAmount: 0n,
      };
      const quantity = this.toScaledQuantity(row.quantity);

      if (row.type === 'buy') {
        current.buyQuantity += quantity;
        current.buyAmount += row.totalAmount;
      } else if (row.type === 'sell') {
        current.sellQuantity += quantity;
        current.sellAmount += row.totalAmount;
      }

      totalsByAssetId.set(row.assetId, current);
    }

    let totalBuyAmount = 0n;
    let totalSellAmount = 0n;
    const assetSummaries = assetRows.map((asset) => {
      const totals = totalsByAssetId.get(asset.id) ?? {
        buyQuantity: 0n,
        sellQuantity: 0n,
        buyAmount: 0n,
        sellAmount: 0n,
      };
      totalBuyAmount += totals.buyAmount;
      totalSellAmount += totals.sellAmount;

      return {
        assetId: asset.id,
        type: this.toAssetType(asset.type),
        symbol: asset.symbol,
        name: asset.name,
        unit: asset.unit,
        currentQuantity: this.formatQuantity(totals.buyQuantity - totals.sellQuantity),
        totalBuyQuantity: this.formatQuantity(totals.buyQuantity),
        totalSellQuantity: this.formatQuantity(totals.sellQuantity),
        totalBuyAmount: this.toSafeNumber(totals.buyAmount),
        totalSellAmount: this.toSafeNumber(totals.sellAmount),
      };
    });

    return {
      currency: 'VND',
      assets: assetSummaries,
      totalBuyAmount: this.toSafeNumber(totalBuyAmount),
      totalSellAmount: this.toSafeNumber(totalSellAmount),
    };
  }

  async getSavingsSummary(
    requesterUserId: string,
    query: SavingsSummaryQuery,
  ): Promise<SavingsSummaryReportResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const rows = await this.db
      .select()
      .from(savingDeposits)
      .where(eq(savingDeposits.householdId, membership.householdId))
      .orderBy(asc(savingDeposits.maturityDate), asc(savingDeposits.bankName));

    let activePrincipalAmount = 0n;
    let activeExpectedInterestAmount = 0n;
    let maturedPrincipalAmount = 0n;
    let maturedActualInterestAmount = 0n;

    const upcomingMaturities = [];

    for (const row of rows) {
      if (row.status === 'active') {
        activePrincipalAmount += row.principalAmount;
        activeExpectedInterestAmount += row.expectedInterestAmount ?? 0n;

        if (this.isDateInOptionalRange(row.maturityDate, query.maturityFrom, query.maturityTo)) {
          upcomingMaturities.push({
            id: row.id,
            bankName: row.bankName,
            principalAmount: this.toSafeNumber(row.principalAmount),
            expectedInterestAmount: row.expectedInterestAmount === null ? null : this.toSafeNumber(row.expectedInterestAmount),
            maturityDate: row.maturityDate,
            paidByUserId: row.paidByUserId,
          });
        }
      } else if (row.status === 'matured') {
        maturedPrincipalAmount += row.principalAmount;
        maturedActualInterestAmount += row.actualInterestAmount ?? 0n;
      }
    }

    return {
      currency: 'VND',
      activePrincipalAmount: this.toSafeNumber(activePrincipalAmount),
      activeExpectedInterestAmount: this.toSafeNumber(activeExpectedInterestAmount),
      maturedPrincipalAmount: this.toSafeNumber(maturedPrincipalAmount),
      maturedActualInterestAmount: this.toSafeNumber(maturedActualInterestAmount),
      upcomingMaturities,
    };
  }

  private async resolveCurrentMembership(userId: string): Promise<CurrentHouseholdMembership> {
    const [row] = await this.db
      .select({
        householdId: households.id,
        role: householdMembers.role,
      })
      .from(householdMembers)
      .innerJoin(households, eq(householdMembers.householdId, households.id))
      .where(and(eq(householdMembers.userId, userId), eq(householdMembers.isActive, true)))
      .limit(1);

    if (!row) {
      throw new UnauthorizedException('User has no active household membership.');
    }

    return {
      householdId: row.householdId,
      role: this.toMemberRole(row.role),
    };
  }

  private monthBounds(month: string): { from: string; to: string } {
    const [yearPart, monthPart] = month.split('-');
    const year = Number(yearPart);
    const monthNumber = Number(monthPart);

    if (!year || !monthNumber) {
      throw new Error(`Unsupported report month: ${month}`);
    }

    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, '0')}` };
  }

  private addCategoryAmount(totals: Map<string, bigint>, categoryId: string | null, amount: bigint): void {
    const key = this.categoryKey(categoryId);
    totals.set(key, (totals.get(key) ?? 0n) + amount);
  }

  private addAmount<TSource extends string>(totals: Map<TSource, bigint>, source: TSource, amount: bigint): void {
    totals.set(source, (totals.get(source) ?? 0n) + amount);
  }

  private categoryKey(categoryId: string | null): string {
    return categoryId ?? '__uncategorized__';
  }

  private fromCategoryKey(categoryKey: string): string | null {
    return categoryKey === '__uncategorized__' ? null : categoryKey;
  }

  private cashFlowSourceKey(sourceType: CashFlowSourceType): string {
    return sourceType ?? '__null__';
  }

  private isDateInOptionalRange(date: string, from: string | undefined, to: string | undefined): boolean {
    if (from && date < from) {
      return false;
    }

    if (to && date > to) {
      return false;
    }

    return true;
  }

  private toScaledQuantity(quantity: string): bigint {
    const [wholePart, fractionalPart = ''] = quantity.split('.');

    if (!wholePart || fractionalPart.length > 10) {
      throw new Error('Stored asset quantity has unsupported precision.');
    }

    return BigInt(wholePart) * QUANTITY_SCALE + BigInt(fractionalPart.padEnd(10, '0'));
  }

  private formatQuantity(quantity: bigint): string {
    const wholePart = quantity / QUANTITY_SCALE;
    const fractionalPart = quantity % QUANTITY_SCALE;

    if (fractionalPart === 0n) {
      return wholePart.toString();
    }

    return `${wholePart.toString()}.${fractionalPart.toString().padStart(10, '0').replace(/0+$/, '')}`;
  }

  private toSafeNumber(amount: bigint): number {
    const numberAmount = Number(amount);

    if (!Number.isSafeInteger(numberAmount)) {
      throw new Error('Report amount exceeds JavaScript safe integer range.');
    }

    return numberAmount;
  }

  private toCashFlowSourceType(sourceType: string | null): CashFlowSourceType {
    if (
      sourceType === null ||
      sourceType === 'manual' ||
      sourceType === 'asset_transaction' ||
      sourceType === 'saving_deposit' ||
      sourceType === 'saving_maturity' ||
      sourceType === 'credit_card_payment' ||
      sourceType === 'installment_payment'
    ) {
      return sourceType;
    }

    throw new Error(`Unsupported cash flow source type: ${sourceType}`);
  }

  private toAssetType(type: string): 'gold' | 'stock' | 'crypto' {
    if (type === 'gold' || type === 'stock' || type === 'crypto') {
      return type;
    }

    throw new Error(`Unsupported asset type: ${type}`);
  }

  private toMemberRole(role: string): 'owner' | 'member' {
    if (role === 'owner' || role === 'member') {
      return role;
    }

    throw new Error(`Unsupported household member role: ${role}`);
  }
}
