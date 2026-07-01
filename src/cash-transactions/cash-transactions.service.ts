import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { and, desc, eq, gte, lte, or } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import { Database } from '../database/database.types.js';
import { cashTransactions, CashTransaction, categories, Category, householdMembers, households } from '../database/schema.js';
import { CreateCashTransactionRequest, ListCashTransactionsQuery, UpdateCashTransactionRequest } from './cash-transactions.schemas.js';
import { CashBalanceResponse, CashTransactionResponse, CashTransactionSourceType, CashTransactionType, CurrentHouseholdMembership } from './cash-transactions.types.js';

@Injectable()
export class CashTransactionsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listCashTransactions(requesterUserId: string, query: ListCashTransactionsQuery): Promise<CashTransactionResponse[]> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const conditions = [eq(cashTransactions.householdId, membership.householdId), eq(cashTransactions.isActive, true)];

    if (query.type) {
      conditions.push(eq(cashTransactions.type, query.type));
    }

    if (query.fromDate) {
      conditions.push(gte(cashTransactions.transactionDate, query.fromDate));
    }

    if (query.toDate) {
      conditions.push(lte(cashTransactions.transactionDate, query.toDate));
    }

    if (query.categoryId) {
      conditions.push(eq(cashTransactions.categoryId, query.categoryId));
    }

    if (query.paidByUserId) {
      conditions.push(eq(cashTransactions.paidByUserId, query.paidByUserId));
    }

    if (query.sourceType) {
      conditions.push(eq(cashTransactions.sourceType, query.sourceType));
    }

    const rows = await this.db
      .select()
      .from(cashTransactions)
      .where(and(...conditions))
      .orderBy(desc(cashTransactions.transactionDate), desc(cashTransactions.createdAt));

    return rows.map((row) => this.toCashTransactionResponse(row));
  }

  async getCashTransaction(requesterUserId: string, cashTransactionId: string): Promise<CashTransactionResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const cashTransaction = await this.findActiveCashTransaction(membership.householdId, cashTransactionId);

    return this.toCashTransactionResponse(cashTransaction);
  }

  async getCashBalance(requesterUserId: string): Promise<CashBalanceResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const rows = await this.db
      .select({ type: cashTransactions.type, amount: cashTransactions.amount })
      .from(cashTransactions)
      .where(and(eq(cashTransactions.householdId, membership.householdId), eq(cashTransactions.isActive, true)));

    let incomeAmount = 0;
    let expenseAmount = 0;

    for (const row of rows) {
      const amount = this.toSafeNumber(row.amount);

      if (row.type === 'income') {
        incomeAmount += amount;
        continue;
      }

      if (row.type === 'expense') {
        expenseAmount += amount;
      }
    }

    return {
      currency: 'VND',
      incomeAmount,
      expenseAmount,
      balance: incomeAmount - expenseAmount,
    };
  }

  async createCashTransaction(requesterUserId: string, input: CreateCashTransactionRequest): Promise<CashTransactionResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);

    await this.validateCategory({
      householdId: membership.householdId,
      categoryId: input.categoryId ?? null,
      type: input.type,
    });
    await this.validatePaidByUser({ householdId: membership.householdId, paidByUserId: input.paidByUserId ?? null });

    const [created] = await this.db
      .insert(cashTransactions)
      .values({
        householdId: membership.householdId,
        type: input.type,
        amount: BigInt(input.amount),
        transactionDate: input.transactionDate,
        categoryId: input.categoryId ?? null,
        paidByUserId: input.paidByUserId ?? null,
        createdByUserId: requesterUserId,
        note: input.note ?? null,
        sourceType: 'manual',
        sourceId: null,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create cash transaction.');
    }

    return this.toCashTransactionResponse(created);
  }

  async updateCashTransaction(
    requesterUserId: string,
    cashTransactionId: string,
    input: UpdateCashTransactionRequest,
  ): Promise<CashTransactionResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const cashTransaction = await this.findActiveCashTransaction(membership.householdId, cashTransactionId);

    this.assertMutableCashTransaction(cashTransaction);

    const nextType = input.type ?? this.toCashTransactionType(cashTransaction.type);
    const nextCategoryId = input.categoryId === undefined ? cashTransaction.categoryId : input.categoryId;
    const nextPaidByUserId = input.paidByUserId === undefined ? cashTransaction.paidByUserId : input.paidByUserId;

    await this.validateCategory({
      householdId: membership.householdId,
      categoryId: nextCategoryId,
      type: nextType,
    });
    await this.validatePaidByUser({ householdId: membership.householdId, paidByUserId: nextPaidByUserId });

    const updates: Partial<typeof cashTransactions.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.type !== undefined) {
      updates.type = input.type;
    }

    if (input.amount !== undefined) {
      updates.amount = BigInt(input.amount);
    }

    if (input.transactionDate !== undefined) {
      updates.transactionDate = input.transactionDate;
    }

    if (input.categoryId !== undefined) {
      updates.categoryId = input.categoryId;
    }

    if (input.paidByUserId !== undefined) {
      updates.paidByUserId = input.paidByUserId;
    }

    if (input.note !== undefined) {
      updates.note = input.note;
    }

    const [updated] = await this.db.update(cashTransactions).set(updates).where(eq(cashTransactions.id, cashTransaction.id)).returning();

    if (!updated) {
      throw new Error('Failed to update cash transaction.');
    }

    return this.toCashTransactionResponse(updated);
  }

  async deleteCashTransaction(requesterUserId: string, cashTransactionId: string): Promise<void> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const cashTransaction = await this.findActiveCashTransaction(membership.householdId, cashTransactionId);

    this.assertMutableCashTransaction(cashTransaction);

    await this.db
      .update(cashTransactions)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(cashTransactions.id, cashTransaction.id));
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

  private async findActiveCashTransaction(householdId: string, cashTransactionId: string): Promise<CashTransaction> {
    const [cashTransaction] = await this.db
      .select()
      .from(cashTransactions)
      .where(
        and(
          eq(cashTransactions.id, cashTransactionId),
          eq(cashTransactions.householdId, householdId),
          eq(cashTransactions.isActive, true),
        ),
      )
      .limit(1);

    if (!cashTransaction) {
      throw new NotFoundException('Cash transaction was not found.');
    }

    return cashTransaction;
  }

  private async validateCategory(input: { householdId: string; categoryId: string | null; type: CashTransactionType }): Promise<void> {
    if (!input.categoryId) {
      return;
    }

    const [category] = await this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, input.categoryId),
          eq(categories.isActive, true),
          or(eq(categories.isSystem, true), eq(categories.householdId, input.householdId)),
        ),
      )
      .limit(1);

    if (!category) {
      throw new ForbiddenException('Category is not accessible for this household.');
    }

    if (category.type !== input.type) {
      throw new BadRequestException('Category type must match cash transaction type.');
    }
  }

  private async validatePaidByUser(input: { householdId: string; paidByUserId: string | null }): Promise<void> {
    if (!input.paidByUserId) {
      return;
    }

    const [membership] = await this.db
      .select({ id: householdMembers.id })
      .from(householdMembers)
      .where(
        and(
          eq(householdMembers.householdId, input.householdId),
          eq(householdMembers.userId, input.paidByUserId),
          eq(householdMembers.isActive, true),
        ),
      )
      .limit(1);

    if (!membership) {
      throw new ForbiddenException('Paid-by user is not an active member of this household.');
    }
  }

  private assertMutableCashTransaction(cashTransaction: CashTransaction): void {
    if (cashTransaction.sourceType !== 'manual') {
      throw new ConflictException('Generated cash transactions cannot be modified through the manual cash transaction API.');
    }
  }

  private toCashTransactionResponse(cashTransaction: CashTransaction): CashTransactionResponse {
    return {
      id: cashTransaction.id,
      householdId: cashTransaction.householdId,
      type: this.toCashTransactionType(cashTransaction.type),
      amount: this.toSafeNumber(cashTransaction.amount),
      transactionDate: cashTransaction.transactionDate,
      categoryId: cashTransaction.categoryId,
      paidByUserId: cashTransaction.paidByUserId,
      createdByUserId: cashTransaction.createdByUserId,
      note: cashTransaction.note,
      sourceType: this.toCashTransactionSourceType(cashTransaction.sourceType),
      sourceId: cashTransaction.sourceId,
      isActive: cashTransaction.isActive,
      createdAt: cashTransaction.createdAt.toISOString(),
      updatedAt: cashTransaction.updatedAt.toISOString(),
    };
  }

  private toCashTransactionType(type: string): CashTransactionType {
    if (type === 'income' || type === 'expense') {
      return type;
    }

    throw new Error(`Unsupported cash transaction type: ${type}`);
  }

  private toCashTransactionSourceType(sourceType: string | null): CashTransactionSourceType | null {
    if (sourceType === null) {
      return null;
    }

    if (
      sourceType === 'manual' ||
      sourceType === 'asset_transaction' ||
      sourceType === 'saving_deposit' ||
      sourceType === 'saving_maturity' ||
      sourceType === 'credit_card_payment' ||
      sourceType === 'installment_payment'
    ) {
      return sourceType;
    }

    throw new Error(`Unsupported cash transaction source type: ${sourceType}`);
  }

  private toSafeNumber(amount: bigint): number {
    const numberAmount = Number(amount);

    if (!Number.isSafeInteger(numberAmount)) {
      throw new Error('Cash transaction amount exceeds JavaScript safe integer range.');
    }

    return numberAmount;
  }

  private toMemberRole(role: string): 'owner' | 'member' {
    if (role === 'owner' || role === 'member') {
      return role;
    }

    throw new Error(`Unsupported household member role: ${role}`);
  }
}
