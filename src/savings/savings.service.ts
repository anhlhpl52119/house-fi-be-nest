import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, desc, eq, gte, lte } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import { Database } from '../database/database.types.js';
import { cashTransactions, householdMembers, households, SavingDeposit, savingDeposits } from '../database/schema.js';
import { CreateSavingDepositRequest, ListSavingDepositsQuery, MatureSavingDepositRequest } from './savings.schemas.js';
import { CurrentHouseholdMembership, SavingDepositResponse, SavingDepositStatus } from './savings.types.js';

const MAX_SAFE_AMOUNT = BigInt(Number.MAX_SAFE_INTEGER);

@Injectable()
export class SavingsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listSavingDeposits(
    requesterUserId: string,
    query: ListSavingDepositsQuery,
  ): Promise<SavingDepositResponse[]> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const conditions = [eq(savingDeposits.householdId, membership.householdId)];

    conditions.push(eq(savingDeposits.status, query.status ?? 'active'));

    if (query.startFrom) {
      conditions.push(gte(savingDeposits.startDate, query.startFrom));
    }

    if (query.startTo) {
      conditions.push(lte(savingDeposits.startDate, query.startTo));
    }

    if (query.maturityFrom) {
      conditions.push(gte(savingDeposits.maturityDate, query.maturityFrom));
    }

    if (query.maturityTo) {
      conditions.push(lte(savingDeposits.maturityDate, query.maturityTo));
    }

    if (query.paidByUserId) {
      conditions.push(eq(savingDeposits.paidByUserId, query.paidByUserId));
    }

    const rows = await this.db
      .select()
      .from(savingDeposits)
      .where(and(...conditions))
      .orderBy(desc(savingDeposits.maturityDate), desc(savingDeposits.createdAt));

    return rows.map((row) => this.toSavingDepositResponse(row));
  }

  async getSavingDeposit(requesterUserId: string, savingDepositId: string): Promise<SavingDepositResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const savingDeposit = await this.findSavingDeposit(membership.householdId, savingDepositId);

    return this.toSavingDepositResponse(savingDeposit);
  }

  async createSavingDeposit(
    requesterUserId: string,
    input: CreateSavingDepositRequest,
  ): Promise<SavingDepositResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    await this.validatePaidByUser({ householdId: membership.householdId, paidByUserId: input.paidByUserId ?? null });

    return this.db.transaction(async (tx) => {
      const [depositCashTransaction] = await tx
        .insert(cashTransactions)
        .values({
          householdId: membership.householdId,
          type: 'expense',
          amount: BigInt(input.principalAmount),
          transactionDate: input.startDate,
          categoryId: null,
          paidByUserId: input.paidByUserId ?? null,
          createdByUserId: requesterUserId,
          note: input.note ?? null,
          sourceType: 'saving_deposit',
          sourceId: null,
        })
        .returning();

      if (!depositCashTransaction) {
        throw new Error('Failed to create generated cash transaction for saving deposit.');
      }

      const [createdSavingDeposit] = await tx
        .insert(savingDeposits)
        .values({
          householdId: membership.householdId,
          bankName: input.bankName,
          principalAmount: BigInt(input.principalAmount),
          interestRate: input.interestRate,
          startDate: input.startDate,
          maturityDate: input.maturityDate,
          termMonths: input.termMonths ?? null,
          expectedInterestAmount:
            input.expectedInterestAmount === undefined ? null : BigInt(input.expectedInterestAmount),
          actualInterestAmount: null,
          status: 'active',
          depositCashTransactionId: depositCashTransaction.id,
          maturityCashTransactionId: null,
          paidByUserId: input.paidByUserId ?? null,
          createdByUserId: requesterUserId,
          note: input.note ?? null,
        })
        .returning();

      if (!createdSavingDeposit) {
        throw new Error('Failed to create saving deposit.');
      }

      await tx
        .update(cashTransactions)
        .set({ sourceId: createdSavingDeposit.id, updatedAt: new Date() })
        .where(eq(cashTransactions.id, depositCashTransaction.id));

      return this.toSavingDepositResponse(createdSavingDeposit);
    });
  }

  async matureSavingDeposit(
    requesterUserId: string,
    savingDepositId: string,
    input: MatureSavingDepositRequest,
  ): Promise<SavingDepositResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);

    return this.db.transaction(async (tx) => {
      const [claimedSavingDeposit] = await tx
        .update(savingDeposits)
        .set({
          status: 'matured',
          actualInterestAmount: BigInt(input.actualInterestAmount),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(savingDeposits.id, savingDepositId),
            eq(savingDeposits.householdId, membership.householdId),
            eq(savingDeposits.status, 'active'),
          ),
        )
        .returning();

      if (!claimedSavingDeposit) {
        const [existingSavingDeposit] = await tx
          .select({ id: savingDeposits.id })
          .from(savingDeposits)
          .where(and(eq(savingDeposits.id, savingDepositId), eq(savingDeposits.householdId, membership.householdId)))
          .limit(1);

        if (!existingSavingDeposit) {
          throw new NotFoundException('Saving deposit was not found.');
        }

        throw new ConflictException('Only active saving deposits can be matured.');
      }

      if (input.maturityDate < claimedSavingDeposit.maturityDate) {
        throw new BadRequestException('maturityDate must be on or after the planned maturityDate.');
      }

      const maturityAmount = claimedSavingDeposit.principalAmount + BigInt(input.actualInterestAmount);

      if (maturityAmount > MAX_SAFE_AMOUNT) {
        throw new BadRequestException('Maturity amount exceeds JavaScript safe integer range.');
      }

      const [maturityCashTransaction] = await tx
        .insert(cashTransactions)
        .values({
          householdId: membership.householdId,
          type: 'income',
          amount: maturityAmount,
          transactionDate: input.maturityDate,
          categoryId: null,
          paidByUserId: claimedSavingDeposit.paidByUserId,
          createdByUserId: requesterUserId,
          note: input.note ?? null,
          sourceType: 'saving_maturity',
          sourceId: null,
        })
        .returning();

      if (!maturityCashTransaction) {
        throw new Error('Failed to create generated cash transaction for saving maturity.');
      }

      const [updatedSavingDeposit] = await tx
        .update(savingDeposits)
        .set({ maturityCashTransactionId: maturityCashTransaction.id, updatedAt: new Date() })
        .where(eq(savingDeposits.id, claimedSavingDeposit.id))
        .returning();

      if (!updatedSavingDeposit) {
        throw new Error('Failed to link saving deposit to generated maturity cash transaction.');
      }

      await tx
        .update(cashTransactions)
        .set({ sourceId: updatedSavingDeposit.id, updatedAt: new Date() })
        .where(eq(cashTransactions.id, maturityCashTransaction.id));

      return this.toSavingDepositResponse(updatedSavingDeposit);
    });
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

  private async findSavingDeposit(householdId: string, savingDepositId: string): Promise<SavingDeposit> {
    const [savingDeposit] = await this.db
      .select()
      .from(savingDeposits)
      .where(and(eq(savingDeposits.id, savingDepositId), eq(savingDeposits.householdId, householdId)))
      .limit(1);

    if (!savingDeposit) {
      throw new NotFoundException('Saving deposit was not found.');
    }

    return savingDeposit;
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

  private toSavingDepositResponse(savingDeposit: SavingDeposit): SavingDepositResponse {
    return {
      id: savingDeposit.id,
      householdId: savingDeposit.householdId,
      bankName: savingDeposit.bankName,
      principalAmount: this.toSafeNumber(savingDeposit.principalAmount),
      interestRate: this.normalizeDecimal(savingDeposit.interestRate),
      startDate: savingDeposit.startDate,
      maturityDate: savingDeposit.maturityDate,
      termMonths: savingDeposit.termMonths,
      expectedInterestAmount:
        savingDeposit.expectedInterestAmount === null ? null : this.toSafeNumber(savingDeposit.expectedInterestAmount),
      actualInterestAmount:
        savingDeposit.actualInterestAmount === null ? null : this.toSafeNumber(savingDeposit.actualInterestAmount),
      status: this.toSavingDepositStatus(savingDeposit.status),
      depositCashTransactionId: savingDeposit.depositCashTransactionId,
      maturityCashTransactionId: savingDeposit.maturityCashTransactionId,
      paidByUserId: savingDeposit.paidByUserId,
      createdByUserId: savingDeposit.createdByUserId,
      note: savingDeposit.note,
      createdAt: savingDeposit.createdAt.toISOString(),
      updatedAt: savingDeposit.updatedAt.toISOString(),
    };
  }

  private toSavingDepositStatus(status: string): SavingDepositStatus {
    if (status === 'active' || status === 'matured' || status === 'withdrawn' || status === 'cancelled') {
      return status;
    }

    throw new Error(`Unsupported saving deposit status: ${status}`);
  }

  private normalizeDecimal(value: string): string {
    const [wholePart = '0', fractionalPart = ''] = value.split('.');
    const normalizedWhole = wholePart.replace(/^0+(?=\d)/, '') || '0';
    const normalizedFractional = fractionalPart.replace(/0+$/, '');

    return normalizedFractional.length > 0 ? `${normalizedWhole}.${normalizedFractional}` : normalizedWhole;
  }

  private toSafeNumber(amount: bigint): number {
    const numberAmount = Number(amount);

    if (!Number.isSafeInteger(numberAmount)) {
      throw new Error('Saving amount exceeds JavaScript safe integer range.');
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
