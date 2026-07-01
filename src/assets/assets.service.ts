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
import {
  Asset,
  assets,
  AssetTransaction,
  assetTransactions,
  cashTransactions,
  householdMembers,
  households,
} from '../database/schema.js';
import {
  CreateAssetRequest,
  CreateAssetTransactionRequest,
  ListAssetsQuery,
  ListAssetTransactionsQuery,
} from './assets.schemas.js';
import {
  AssetResponse,
  AssetTransactionResponse,
  AssetTransactionType,
  AssetType,
  CurrentHouseholdMembership,
} from './assets.types.js';

const QUANTITY_SCALE = 10_000_000_000n;

@Injectable()
export class AssetsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listAssets(requesterUserId: string, query: ListAssetsQuery): Promise<AssetResponse[]> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const conditions = [eq(assets.householdId, membership.householdId), eq(assets.isActive, true)];

    if (query.type) {
      conditions.push(eq(assets.type, query.type));
    }

    const rows = await this.db
      .select()
      .from(assets)
      .where(and(...conditions))
      .orderBy(assets.type, assets.name, desc(assets.createdAt));

    const quantityByAssetId = await this.getQuantityByAssetId(membership.householdId);

    return rows.map((row) => this.toAssetResponse(row, quantityByAssetId.get(row.id) ?? 0n));
  }

  async getAsset(requesterUserId: string, assetId: string): Promise<AssetResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const asset = await this.findActiveAsset(membership.householdId, assetId);
    const currentQuantity = await this.getCurrentQuantity(membership.householdId, asset.id);

    return this.toAssetResponse(asset, currentQuantity);
  }

  async createAsset(requesterUserId: string, input: CreateAssetRequest): Promise<AssetResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const [created] = await this.db
      .insert(assets)
      .values({
        householdId: membership.householdId,
        type: input.type,
        symbol: input.symbol ?? null,
        name: input.name,
        unit: input.unit,
        isActive: true,
        createdByUserId: requesterUserId,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create asset.');
    }

    return this.toAssetResponse(created, 0n);
  }

  async listAssetTransactions(
    requesterUserId: string,
    query: ListAssetTransactionsQuery,
  ): Promise<AssetTransactionResponse[]> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const conditions = [eq(assetTransactions.householdId, membership.householdId)];

    if (query.assetId) {
      conditions.push(eq(assetTransactions.assetId, query.assetId));
    }

    if (query.type) {
      conditions.push(eq(assetTransactions.type, query.type));
    }

    if (query.fromDate) {
      conditions.push(gte(assetTransactions.transactionDate, query.fromDate));
    }

    if (query.toDate) {
      conditions.push(lte(assetTransactions.transactionDate, query.toDate));
    }

    if (query.paidByUserId) {
      conditions.push(eq(assetTransactions.paidByUserId, query.paidByUserId));
    }

    const rows = await this.db
      .select()
      .from(assetTransactions)
      .where(and(...conditions))
      .orderBy(desc(assetTransactions.transactionDate), desc(assetTransactions.createdAt));

    return rows.map((row) => this.toAssetTransactionResponse(row));
  }

  async createAssetTransaction(
    requesterUserId: string,
    assetId: string,
    input: CreateAssetTransactionRequest,
  ): Promise<AssetTransactionResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    await this.findActiveAsset(membership.householdId, assetId);
    await this.validatePaidByUser({ householdId: membership.householdId, paidByUserId: input.paidByUserId ?? null });

    const quantity = this.toScaledQuantity(input.quantity);

    return this.db.transaction(async (tx) => {
      if (input.type === 'sell') {
        const currentQuantity = await this.getCurrentQuantityForTransaction(tx, membership.householdId, assetId);

        if (currentQuantity < quantity) {
          throw new ConflictException('Sell quantity cannot exceed the current asset holding quantity.');
        }
      }

      const [createdAssetTransaction] = await tx
        .insert(assetTransactions)
        .values({
          householdId: membership.householdId,
          assetId,
          type: input.type,
          quantity: input.quantity,
          unitPrice: BigInt(input.unitPrice),
          totalAmount: BigInt(input.totalAmount),
          transactionDate: input.transactionDate,
          cashTransactionId: null,
          paidByUserId: input.paidByUserId ?? null,
          createdByUserId: requesterUserId,
          note: input.note ?? null,
        })
        .returning();

      if (!createdAssetTransaction) {
        throw new Error('Failed to create asset transaction.');
      }

      const [cashTransaction] = await tx
        .insert(cashTransactions)
        .values({
          householdId: membership.householdId,
          type: input.type === 'buy' ? 'expense' : 'income',
          amount: BigInt(input.totalAmount),
          transactionDate: input.transactionDate,
          categoryId: null,
          paidByUserId: input.paidByUserId ?? null,
          createdByUserId: requesterUserId,
          note: input.note ?? null,
          sourceType: 'asset_transaction',
          sourceId: null,
        })
        .returning();

      if (!cashTransaction) {
        throw new Error('Failed to create generated cash transaction for asset transaction.');
      }

      const [updatedAssetTransaction] = await tx
        .update(assetTransactions)
        .set({ cashTransactionId: cashTransaction.id, updatedAt: new Date() })
        .where(eq(assetTransactions.id, createdAssetTransaction.id))
        .returning();

      if (!updatedAssetTransaction) {
        throw new Error('Failed to link asset transaction to generated cash transaction.');
      }

      await tx
        .update(cashTransactions)
        .set({ sourceId: updatedAssetTransaction.id, updatedAt: new Date() })
        .where(eq(cashTransactions.id, cashTransaction.id));

      return this.toAssetTransactionResponse(updatedAssetTransaction);
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

  private async findActiveAsset(householdId: string, assetId: string): Promise<Asset> {
    const [asset] = await this.db
      .select()
      .from(assets)
      .where(and(eq(assets.id, assetId), eq(assets.householdId, householdId), eq(assets.isActive, true)))
      .limit(1);

    if (!asset) {
      throw new NotFoundException('Asset was not found.');
    }

    return asset;
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

  private async getQuantityByAssetId(householdId: string): Promise<Map<string, bigint>> {
    const rows = await this.db
      .select({ assetId: assetTransactions.assetId, type: assetTransactions.type, quantity: assetTransactions.quantity })
      .from(assetTransactions)
      .where(eq(assetTransactions.householdId, householdId));

    const quantityByAssetId = new Map<string, bigint>();

    for (const row of rows) {
      const currentQuantity = quantityByAssetId.get(row.assetId) ?? 0n;
      const quantity = this.toScaledQuantity(row.quantity);
      quantityByAssetId.set(row.assetId, row.type === 'buy' ? currentQuantity + quantity : currentQuantity - quantity);
    }

    return quantityByAssetId;
  }

  private async getCurrentQuantity(householdId: string, assetId: string): Promise<bigint> {
    const rows = await this.db
      .select({ type: assetTransactions.type, quantity: assetTransactions.quantity })
      .from(assetTransactions)
      .where(and(eq(assetTransactions.householdId, householdId), eq(assetTransactions.assetId, assetId)));

    return this.sumQuantities(rows);
  }

  private async getCurrentQuantityForTransaction(
    tx: Parameters<Parameters<Database['transaction']>[0]>[0],
    householdId: string,
    assetId: string,
  ): Promise<bigint> {
    const rows = await tx
      .select({ type: assetTransactions.type, quantity: assetTransactions.quantity })
      .from(assetTransactions)
      .where(and(eq(assetTransactions.householdId, householdId), eq(assetTransactions.assetId, assetId)));

    return this.sumQuantities(rows);
  }

  private sumQuantities(rows: Array<{ type: string; quantity: string }>): bigint {
    return rows.reduce((total, row) => {
      const quantity = this.toScaledQuantity(row.quantity);
      return row.type === 'buy' ? total + quantity : total - quantity;
    }, 0n);
  }

  private toAssetResponse(asset: Asset, currentQuantity: bigint): AssetResponse {
    return {
      id: asset.id,
      householdId: asset.householdId,
      type: this.toAssetType(asset.type),
      symbol: asset.symbol,
      name: asset.name,
      unit: asset.unit,
      currentQuantity: this.formatQuantity(currentQuantity),
      isActive: asset.isActive,
      createdByUserId: asset.createdByUserId,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString(),
    };
  }

  private toAssetTransactionResponse(assetTransaction: AssetTransaction): AssetTransactionResponse {
    return {
      id: assetTransaction.id,
      householdId: assetTransaction.householdId,
      assetId: assetTransaction.assetId,
      type: this.toAssetTransactionType(assetTransaction.type),
      quantity: this.formatQuantity(this.toScaledQuantity(assetTransaction.quantity)),
      unitPrice: this.toSafeNumber(assetTransaction.unitPrice),
      totalAmount: this.toSafeNumber(assetTransaction.totalAmount),
      transactionDate: assetTransaction.transactionDate,
      cashTransactionId: assetTransaction.cashTransactionId,
      paidByUserId: assetTransaction.paidByUserId,
      createdByUserId: assetTransaction.createdByUserId,
      note: assetTransaction.note,
      createdAt: assetTransaction.createdAt.toISOString(),
      updatedAt: assetTransaction.updatedAt.toISOString(),
    };
  }

  private toScaledQuantity(quantity: string): bigint {
    const [wholePart, fractionalPart = ''] = quantity.split('.');

    if (!wholePart || fractionalPart.length > 10) {
      throw new BadRequestException('quantity must be a decimal string with at most 10 fractional digits.');
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
      throw new Error('Asset transaction amount exceeds JavaScript safe integer range.');
    }

    return numberAmount;
  }

  private toAssetType(type: string): AssetType {
    if (type === 'gold' || type === 'stock' || type === 'crypto') {
      return type;
    }

    throw new Error(`Unsupported asset type: ${type}`);
  }

  private toAssetTransactionType(type: string): AssetTransactionType {
    if (type === 'buy' || type === 'sell') {
      return type;
    }

    throw new Error(`Unsupported asset transaction type: ${type}`);
  }

  private toMemberRole(role: string): 'owner' | 'member' {
    if (role === 'owner' || role === 'member') {
      return role;
    }

    throw new Error(`Unsupported household member role: ${role}`);
  }
}
