import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, asc, desc, eq, gte, lte, or } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import { Database } from '../database/database.types.js';
import {
  cashTransactions,
  categories,
  householdMembers,
  households,
  InstallmentPayment,
  installmentPayments,
  InstallmentPlan,
  installmentPlans,
} from '../database/schema.js';
import {
  CreateInstallmentPlanRequest,
  ListInstallmentPlansQuery,
  ListUpcomingInstallmentPaymentsQuery,
  PayInstallmentPaymentRequest,
} from './installments.schemas.js';
import {
  CurrentHouseholdMembership,
  InstallmentPaymentResponse,
  InstallmentPaymentStatus,
  InstallmentPlanDetailResponse,
  InstallmentPlanResponse,
  InstallmentPlanStatus,
} from './installments.types.js';

@Injectable()
export class InstallmentsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listInstallmentPlans(
    requesterUserId: string,
    query: ListInstallmentPlansQuery,
  ): Promise<InstallmentPlanResponse[]> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const conditions = [eq(installmentPlans.householdId, membership.householdId)];

    conditions.push(eq(installmentPlans.status, query.status ?? 'active'));

    if (query.fromDate) {
      conditions.push(gte(installmentPlans.purchaseDate, query.fromDate));
    }

    if (query.toDate) {
      conditions.push(lte(installmentPlans.purchaseDate, query.toDate));
    }

    if (query.categoryId) {
      conditions.push(eq(installmentPlans.categoryId, query.categoryId));
    }

    if (query.paidByUserId) {
      conditions.push(eq(installmentPlans.paidByUserId, query.paidByUserId));
    }

    const rows = await this.db
      .select()
      .from(installmentPlans)
      .where(and(...conditions))
      .orderBy(desc(installmentPlans.purchaseDate), desc(installmentPlans.createdAt));

    return rows.map((row) => this.toInstallmentPlanResponse(row));
  }

  async getInstallmentPlan(
    requesterUserId: string,
    installmentPlanId: string,
  ): Promise<InstallmentPlanDetailResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const installmentPlan = await this.findInstallmentPlan(membership.householdId, installmentPlanId);
    const payments = await this.db
      .select()
      .from(installmentPayments)
      .where(
        and(
          eq(installmentPayments.installmentPlanId, installmentPlan.id),
          eq(installmentPayments.householdId, membership.householdId),
        ),
      )
      .orderBy(asc(installmentPayments.sequenceNo), asc(installmentPayments.dueDate));

    return this.toInstallmentPlanDetailResponse(installmentPlan, payments);
  }

  async createInstallmentPlan(
    requesterUserId: string,
    input: CreateInstallmentPlanRequest,
  ): Promise<InstallmentPlanDetailResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);

    await this.validateExpenseCategory({
      householdId: membership.householdId,
      categoryId: input.categoryId ?? null,
    });
    await this.validatePaidByUser({
      householdId: membership.householdId,
      paidByUserId: input.paidByUserId ?? null,
    });

    return this.db.transaction(async (tx) => {
      const [createdPlan] = await tx
        .insert(installmentPlans)
        .values({
          householdId: membership.householdId,
          originalAmount: BigInt(input.originalAmount),
          purchaseDate: input.purchaseDate,
          categoryId: input.categoryId ?? null,
          paidByUserId: input.paidByUserId ?? null,
          createdByUserId: requesterUserId,
          note: input.note ?? null,
          installmentCount: input.installmentCount,
          monthlyAmount: BigInt(input.monthlyAmount),
          status: 'active',
        })
        .returning();

      if (!createdPlan) {
        throw new Error('Failed to create installment plan.');
      }

      const scheduledPayments = this.buildScheduledPayments({
        householdId: membership.householdId,
        installmentPlanId: createdPlan.id,
        installmentCount: input.installmentCount,
        monthlyAmount: BigInt(input.monthlyAmount),
        firstDueDate: input.firstDueDate,
      });

      const createdPayments = await tx.insert(installmentPayments).values(scheduledPayments).returning();

      return this.toInstallmentPlanDetailResponse(createdPlan, createdPayments);
    });
  }

  async listUpcomingInstallmentPayments(
    requesterUserId: string,
    query: ListUpcomingInstallmentPaymentsQuery,
  ): Promise<InstallmentPaymentResponse[]> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const conditions = [
      eq(installmentPayments.householdId, membership.householdId),
      eq(installmentPayments.status, 'pending'),
    ];

    if (query.installmentPlanId) {
      conditions.push(eq(installmentPayments.installmentPlanId, query.installmentPlanId));
    }

    if (query.dueFrom) {
      conditions.push(gte(installmentPayments.dueDate, query.dueFrom));
    }

    if (query.dueTo) {
      conditions.push(lte(installmentPayments.dueDate, query.dueTo));
    }

    const rows = await this.db
      .select()
      .from(installmentPayments)
      .where(and(...conditions))
      .orderBy(asc(installmentPayments.dueDate), asc(installmentPayments.sequenceNo), desc(installmentPayments.createdAt));

    return rows.map((row) => this.toInstallmentPaymentResponse(row));
  }

  async payInstallmentPayment(
    requesterUserId: string,
    installmentPaymentId: string,
    input: PayInstallmentPaymentRequest,
  ): Promise<InstallmentPaymentResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);

    return this.db.transaction(async (tx) => {
      const settlementTime = new Date();
      const [claimedPayment] = await tx
        .update(installmentPayments)
        .set({
          status: 'paid',
          paidDate: input.paidDate,
          cashTransactionId: null,
          updatedAt: settlementTime,
        })
        .where(
          and(
            eq(installmentPayments.id, installmentPaymentId),
            eq(installmentPayments.householdId, membership.householdId),
            eq(installmentPayments.status, 'pending'),
          ),
        )
        .returning();

      if (!claimedPayment) {
        const [existingPayment] = await tx
          .select({ id: installmentPayments.id })
          .from(installmentPayments)
          .where(
            and(
              eq(installmentPayments.id, installmentPaymentId),
              eq(installmentPayments.householdId, membership.householdId),
            ),
          )
          .limit(1);

        if (!existingPayment) {
          throw new NotFoundException('Installment payment was not found.');
        }

        throw new ConflictException('Only pending installment payments can be paid.');
      }

      const [installmentPlan] = await tx
        .select()
        .from(installmentPlans)
        .where(
          and(
            eq(installmentPlans.id, claimedPayment.installmentPlanId),
            eq(installmentPlans.householdId, membership.householdId),
          ),
        )
        .limit(1);

      if (!installmentPlan) {
        throw new Error('Installment plan was not found for the selected payment.');
      }

      if (installmentPlan.status === 'cancelled') {
        throw new ConflictException('Cancelled installment plans cannot accept payments.');
      }

      if (BigInt(input.amount) !== claimedPayment.amount) {
        throw new BadRequestException('amount must exactly match the scheduled installment payment amount.');
      }

      if (input.paidDate < installmentPlan.purchaseDate) {
        throw new BadRequestException('paidDate must be on or after the installment purchase date.');
      }

      const [cashTransaction] = await tx
        .insert(cashTransactions)
        .values({
          householdId: membership.householdId,
          type: 'expense',
          amount: claimedPayment.amount,
          transactionDate: input.paidDate,
          categoryId: null,
          paidByUserId: null,
          createdByUserId: requesterUserId,
          note: input.note ?? null,
          sourceType: 'installment_payment',
          sourceId: null,
        })
        .returning();

      if (!cashTransaction) {
        throw new Error('Failed to create generated cash transaction for installment payment.');
      }

      const [updatedPayment] = await tx
        .update(installmentPayments)
        .set({ cashTransactionId: cashTransaction.id, updatedAt: new Date() })
        .where(eq(installmentPayments.id, claimedPayment.id))
        .returning();

      if (!updatedPayment) {
        throw new Error('Failed to update installment payment.');
      }

      await tx
        .update(cashTransactions)
        .set({ sourceId: updatedPayment.id, updatedAt: new Date() })
        .where(eq(cashTransactions.id, cashTransaction.id));

      const [pendingPayment] = await tx
        .select({ id: installmentPayments.id })
        .from(installmentPayments)
        .where(
          and(
            eq(installmentPayments.installmentPlanId, installmentPlan.id),
            eq(installmentPayments.householdId, membership.householdId),
            eq(installmentPayments.status, 'pending'),
          ),
        )
        .limit(1);

      if (!pendingPayment) {
        await tx
          .update(installmentPlans)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(installmentPlans.id, installmentPlan.id));
      }

      return this.toInstallmentPaymentResponse(updatedPayment);
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

  private async findInstallmentPlan(householdId: string, installmentPlanId: string): Promise<InstallmentPlan> {
    const [installmentPlan] = await this.db
      .select()
      .from(installmentPlans)
      .where(
        and(
          eq(installmentPlans.id, installmentPlanId),
          eq(installmentPlans.householdId, householdId),
        ),
      )
      .limit(1);

    if (!installmentPlan) {
      throw new NotFoundException('Installment plan was not found.');
    }

    return installmentPlan;
  }

  private async validateExpenseCategory(input: {
    householdId: string;
    categoryId: string | null;
  }): Promise<void> {
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
      throw new BadRequestException('Installment plans must use an expense category.');
    }
  }

  private async validatePaidByUser(input: {
    householdId: string;
    paidByUserId: string | null;
  }): Promise<void> {
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

  private buildScheduledPayments(input: {
    householdId: string;
    installmentPlanId: string;
    installmentCount: number;
    monthlyAmount: bigint;
    firstDueDate: string;
  }): Array<typeof installmentPayments.$inferInsert> {
    return Array.from({ length: input.installmentCount }, (_, index) => ({
      householdId: input.householdId,
      installmentPlanId: input.installmentPlanId,
      sequenceNo: index + 1,
      amount: input.monthlyAmount,
      dueDate: this.addCalendarMonths(input.firstDueDate, index),
      status: 'pending',
      paidDate: null,
      cashTransactionId: null,
    }));
  }

  private addCalendarMonths(dateString: string, monthsToAdd: number): string {
    const parts = dateString.split('-').map((part) => Number(part));
    const yearPart = parts[0];
    const monthPart = parts[1];
    const dayPart = parts[2];

    if (!yearPart || !monthPart || !dayPart) {
      throw new Error(`Unsupported ISO date for installment schedule generation: ${dateString}`);
    }

    const monthIndex = monthPart - 1 + monthsToAdd;
    const targetYear = yearPart + Math.floor(monthIndex / 12);
    const normalizedMonthIndex = ((monthIndex % 12) + 12) % 12;
    const targetMonth = normalizedMonthIndex + 1;
    const lastDayOfMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
    const targetDay = Math.min(dayPart, lastDayOfMonth);

    return `${targetYear}-${this.padDatePart(targetMonth)}-${this.padDatePart(targetDay)}`;
  }

  private padDatePart(value: number): string {
    return String(value).padStart(2, '0');
  }

  private toInstallmentPlanResponse(installmentPlan: InstallmentPlan): InstallmentPlanResponse {
    return {
      id: installmentPlan.id,
      householdId: installmentPlan.householdId,
      originalAmount: this.toSafeNumber(installmentPlan.originalAmount),
      purchaseDate: installmentPlan.purchaseDate,
      categoryId: installmentPlan.categoryId,
      paidByUserId: installmentPlan.paidByUserId,
      createdByUserId: installmentPlan.createdByUserId,
      note: installmentPlan.note,
      installmentCount: installmentPlan.installmentCount,
      monthlyAmount: this.toSafeNumber(installmentPlan.monthlyAmount),
      status: this.toInstallmentPlanStatus(installmentPlan.status),
      createdAt: installmentPlan.createdAt.toISOString(),
      updatedAt: installmentPlan.updatedAt.toISOString(),
    };
  }

  private toInstallmentPlanDetailResponse(
    installmentPlan: InstallmentPlan,
    payments: InstallmentPayment[],
  ): InstallmentPlanDetailResponse {
    return {
      ...this.toInstallmentPlanResponse(installmentPlan),
      payments: payments.map((payment) => this.toInstallmentPaymentResponse(payment)),
    };
  }

  private toInstallmentPaymentResponse(
    installmentPayment: InstallmentPayment,
  ): InstallmentPaymentResponse {
    return {
      id: installmentPayment.id,
      householdId: installmentPayment.householdId,
      installmentPlanId: installmentPayment.installmentPlanId,
      sequenceNo: installmentPayment.sequenceNo,
      amount: this.toSafeNumber(installmentPayment.amount),
      dueDate: installmentPayment.dueDate,
      status: this.toInstallmentPaymentStatus(installmentPayment.status),
      paidDate: installmentPayment.paidDate,
      cashTransactionId: installmentPayment.cashTransactionId,
      createdAt: installmentPayment.createdAt.toISOString(),
      updatedAt: installmentPayment.updatedAt.toISOString(),
    };
  }

  private toInstallmentPlanStatus(status: string): InstallmentPlanStatus {
    if (status === 'active' || status === 'completed' || status === 'cancelled') {
      return status;
    }

    throw new Error(`Unsupported installment plan status: ${status}`);
  }

  private toInstallmentPaymentStatus(status: string): InstallmentPaymentStatus {
    if (status === 'pending' || status === 'paid' || status === 'cancelled') {
      return status;
    }

    throw new Error(`Unsupported installment payment status: ${status}`);
  }

  private toSafeNumber(amount: bigint): number {
    const numberAmount = Number(amount);

    if (!Number.isSafeInteger(numberAmount)) {
      throw new Error('Installment amount exceeds JavaScript safe integer range.');
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
