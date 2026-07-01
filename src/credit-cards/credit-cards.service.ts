import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { and, asc, desc, eq, gte, lte, or } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import { Database } from '../database/database.types.js';
import {
  cashTransactions,
  categories,
  CreditCardPayment,
  creditCardPayments,
  CreditCardTransaction,
  creditCardTransactions,
  householdMembers,
  households,
} from '../database/schema.js';
import {
  CreateCreditCardTransactionRequest,
  ListCreditCardPaymentsQuery,
  ListCreditCardTransactionsQuery,
  ResolveCreditCardTransactionRequest,
} from './credit-cards.schemas.js';
import {
  CreditCardPaymentResponse,
  CreditCardTransactionResponse,
  CreditCardTransactionStatus,
  CurrentHouseholdMembership,
} from './credit-cards.types.js';

@Injectable()
export class CreditCardsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listCreditCardTransactions(
    requesterUserId: string,
    query: ListCreditCardTransactionsQuery,
  ): Promise<CreditCardTransactionResponse[]> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const conditions = [eq(creditCardTransactions.householdId, membership.householdId)];

    conditions.push(eq(creditCardTransactions.status, query.status ?? 'pending'));

    if (query.fromDate) {
      conditions.push(gte(creditCardTransactions.transactionDate, query.fromDate));
    }

    if (query.toDate) {
      conditions.push(lte(creditCardTransactions.transactionDate, query.toDate));
    }

    if (query.categoryId) {
      conditions.push(eq(creditCardTransactions.categoryId, query.categoryId));
    }

    if (query.paidByUserId) {
      conditions.push(eq(creditCardTransactions.paidByUserId, query.paidByUserId));
    }

    if (query.expectedPaymentFrom) {
      conditions.push(gte(creditCardTransactions.expectedPaymentDate, query.expectedPaymentFrom));
    }

    if (query.expectedPaymentTo) {
      conditions.push(lte(creditCardTransactions.expectedPaymentDate, query.expectedPaymentTo));
    }

    const rows = await this.db
      .select()
      .from(creditCardTransactions)
      .where(and(...conditions))
      .orderBy(
        asc(creditCardTransactions.expectedPaymentDate),
        desc(creditCardTransactions.transactionDate),
        desc(creditCardTransactions.createdAt),
      );

    return rows.map((row) => this.toCreditCardTransactionResponse(row));
  }

  async createCreditCardTransaction(
    requesterUserId: string,
    input: CreateCreditCardTransactionRequest,
  ): Promise<CreditCardTransactionResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);

    await this.validateExpenseCategory({ householdId: membership.householdId, categoryId: input.categoryId ?? null });
    await this.validatePaidByUser({ householdId: membership.householdId, paidByUserId: input.paidByUserId ?? null });

    const [created] = await this.db
      .insert(creditCardTransactions)
      .values({
        householdId: membership.householdId,
        amount: BigInt(input.amount),
        transactionDate: input.transactionDate,
        categoryId: input.categoryId ?? null,
        paidByUserId: input.paidByUserId ?? null,
        createdByUserId: requesterUserId,
        note: input.note ?? null,
        status: 'pending',
        expectedPaymentDate: input.expectedPaymentDate ?? null,
        resolvedPaymentId: null,
        resolvedAt: null,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create credit card transaction.');
    }

    return this.toCreditCardTransactionResponse(created);
  }

  async resolveCreditCardTransaction(
    requesterUserId: string,
    creditCardTransactionId: string,
    input: ResolveCreditCardTransactionRequest,
  ): Promise<CreditCardPaymentResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);

    return this.db.transaction(async (tx) => {
      const resolutionTime = new Date();
      const [claimedTransaction] = await tx
        .update(creditCardTransactions)
        .set({
          status: 'resolved',
          resolvedAt: resolutionTime,
          resolvedPaymentId: null,
          updatedAt: resolutionTime,
        })
        .where(
          and(
            eq(creditCardTransactions.id, creditCardTransactionId),
            eq(creditCardTransactions.householdId, membership.householdId),
            eq(creditCardTransactions.status, 'pending'),
          ),
        )
        .returning();

      if (!claimedTransaction) {
        const [existingTransaction] = await tx
          .select({ id: creditCardTransactions.id })
          .from(creditCardTransactions)
          .where(
            and(
              eq(creditCardTransactions.id, creditCardTransactionId),
              eq(creditCardTransactions.householdId, membership.householdId),
            ),
          )
          .limit(1);

        if (!existingTransaction) {
          throw new NotFoundException('Credit card transaction was not found.');
        }

        throw new ConflictException('Only pending credit card transactions can be resolved.');
      }

      if (input.paymentDate < claimedTransaction.transactionDate) {
        throw new BadRequestException('paymentDate must be on or after the credit card transaction date.');
      }

      const [cashTransaction] = await tx
        .insert(cashTransactions)
        .values({
          householdId: membership.householdId,
          type: 'expense',
          amount: claimedTransaction.amount,
          transactionDate: input.paymentDate,
          categoryId: null,
          paidByUserId: null,
          createdByUserId: requesterUserId,
          note: input.note ?? null,
          sourceType: 'credit_card_payment',
          sourceId: null,
        })
        .returning();

      if (!cashTransaction) {
        throw new Error('Failed to create generated cash transaction for credit card payment.');
      }

      const [payment] = await tx
        .insert(creditCardPayments)
        .values({
          householdId: membership.householdId,
          creditCardTransactionId: claimedTransaction.id,
          amount: claimedTransaction.amount,
          paymentDate: input.paymentDate,
          cashTransactionId: cashTransaction.id,
          createdByUserId: requesterUserId,
          note: input.note ?? null,
        })
        .returning();

      if (!payment) {
        throw new Error('Failed to create credit card payment.');
      }

      await tx
        .update(cashTransactions)
        .set({ sourceId: payment.id, updatedAt: new Date() })
        .where(eq(cashTransactions.id, cashTransaction.id));

      await tx
        .update(creditCardTransactions)
        .set({ resolvedPaymentId: payment.id, updatedAt: new Date() })
        .where(eq(creditCardTransactions.id, claimedTransaction.id));

      return this.toCreditCardPaymentResponse(payment);
    });
  }

  async listCreditCardPayments(requesterUserId: string, query: ListCreditCardPaymentsQuery): Promise<CreditCardPaymentResponse[]> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const conditions = [eq(creditCardPayments.householdId, membership.householdId)];

    if (query.creditCardTransactionId) {
      conditions.push(eq(creditCardPayments.creditCardTransactionId, query.creditCardTransactionId));
    }

    if (query.fromDate) {
      conditions.push(gte(creditCardPayments.paymentDate, query.fromDate));
    }

    if (query.toDate) {
      conditions.push(lte(creditCardPayments.paymentDate, query.toDate));
    }

    const rows = await this.db
      .select()
      .from(creditCardPayments)
      .where(and(...conditions))
      .orderBy(desc(creditCardPayments.paymentDate), desc(creditCardPayments.createdAt));

    return rows.map((row) => this.toCreditCardPaymentResponse(row));
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

  private async validateExpenseCategory(input: { householdId: string; categoryId: string | null }): Promise<void> {
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

    if (category.type !== 'expense') {
      throw new BadRequestException('Credit card transactions must use an expense category.');
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

  private toCreditCardTransactionResponse(creditCardTransaction: CreditCardTransaction): CreditCardTransactionResponse {
    return {
      id: creditCardTransaction.id,
      householdId: creditCardTransaction.householdId,
      amount: this.toSafeNumber(creditCardTransaction.amount),
      transactionDate: creditCardTransaction.transactionDate,
      categoryId: creditCardTransaction.categoryId,
      paidByUserId: creditCardTransaction.paidByUserId,
      createdByUserId: creditCardTransaction.createdByUserId,
      note: creditCardTransaction.note,
      status: this.toCreditCardTransactionStatus(creditCardTransaction.status),
      expectedPaymentDate: creditCardTransaction.expectedPaymentDate,
      resolvedPaymentId: creditCardTransaction.resolvedPaymentId,
      resolvedAt: creditCardTransaction.resolvedAt?.toISOString() ?? null,
      createdAt: creditCardTransaction.createdAt.toISOString(),
      updatedAt: creditCardTransaction.updatedAt.toISOString(),
    };
  }

  private toCreditCardPaymentResponse(creditCardPayment: CreditCardPayment): CreditCardPaymentResponse {
    return {
      id: creditCardPayment.id,
      householdId: creditCardPayment.householdId,
      creditCardTransactionId: creditCardPayment.creditCardTransactionId,
      amount: this.toSafeNumber(creditCardPayment.amount),
      paymentDate: creditCardPayment.paymentDate,
      cashTransactionId: creditCardPayment.cashTransactionId,
      createdByUserId: creditCardPayment.createdByUserId,
      note: creditCardPayment.note,
      createdAt: creditCardPayment.createdAt.toISOString(),
      updatedAt: creditCardPayment.updatedAt.toISOString(),
    };
  }

  private toCreditCardTransactionStatus(status: string): CreditCardTransactionStatus {
    if (status === 'pending' || status === 'resolved' || status === 'cancelled') {
      return status;
    }

    throw new Error(`Unsupported credit card transaction status: ${status}`);
  }

  private toSafeNumber(amount: bigint): number {
    const numberAmount = Number(amount);

    if (!Number.isSafeInteger(numberAmount)) {
      throw new Error('Credit card amount exceeds JavaScript safe integer range.');
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
