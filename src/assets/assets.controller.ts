import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { z, ZodType } from 'zod';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import {
  AssetIdParamSchema,
  CreateAssetRequest,
  CreateAssetRequestSchema,
  CreateAssetTransactionRequest,
  CreateAssetTransactionRequestSchema,
  ListAssetsQuery,
  ListAssetsQuerySchema,
  ListAssetTransactionsQuery,
  ListAssetTransactionsQuerySchema,
} from './assets.schemas.js';
import { AssetsService } from './assets.service.js';
import { AssetResponse, AssetTransactionResponse } from './assets.types.js';

@Controller('assets')
@UseGuards(AccessTokenGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  async listAssets(@Req() request: AuthenticatedRequest, @Query() query: unknown): Promise<{ data: AssetResponse[] }> {
    return {
      data: await this.assetsService.listAssets(
        this.getAuthenticatedUserId(request),
        this.parseInput(ListAssetsQuerySchema, query),
      ),
    };
  }

  @Post()
  async createAsset(@Req() request: AuthenticatedRequest, @Body() body: unknown): Promise<{ data: AssetResponse }> {
    return {
      data: await this.assetsService.createAsset(
        this.getAuthenticatedUserId(request),
        this.parseInput(CreateAssetRequestSchema, body),
      ),
    };
  }

  @Get('transactions')
  async listAssetTransactions(
    @Req() request: AuthenticatedRequest,
    @Query() query: unknown,
  ): Promise<{ data: AssetTransactionResponse[] }> {
    return {
      data: await this.assetsService.listAssetTransactions(
        this.getAuthenticatedUserId(request),
        this.parseInput(ListAssetTransactionsQuerySchema, query),
      ),
    };
  }

  @Get(':id')
  async getAsset(@Req() request: AuthenticatedRequest, @Param('id') id: unknown): Promise<{ data: AssetResponse }> {
    return {
      data: await this.assetsService.getAsset(
        this.getAuthenticatedUserId(request),
        this.parseInput(AssetIdParamSchema, id),
      ),
    };
  }

  @Post(':id/transactions')
  async createAssetTransaction(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: unknown,
    @Body() body: unknown,
  ): Promise<{ data: AssetTransactionResponse }> {
    return {
      data: await this.assetsService.createAssetTransaction(
        this.getAuthenticatedUserId(request),
        this.parseInput(AssetIdParamSchema, id),
        this.parseInput(CreateAssetTransactionRequestSchema, body),
      ),
    };
  }

  private getAuthenticatedUserId(request: AuthenticatedRequest): string {
    if (!request.auth) {
      throw new BadRequestException('Authenticated request context is missing.');
    }

    return request.auth.userId;
  }

  private parseInput(schema: typeof ListAssetsQuerySchema, input: unknown): ListAssetsQuery;
  private parseInput(schema: typeof CreateAssetRequestSchema, input: unknown): CreateAssetRequest;
  private parseInput(schema: typeof AssetIdParamSchema, input: unknown): string;
  private parseInput(schema: typeof ListAssetTransactionsQuerySchema, input: unknown): ListAssetTransactionsQuery;
  private parseInput(schema: typeof CreateAssetTransactionRequestSchema, input: unknown): CreateAssetTransactionRequest;
  private parseInput<T>(schema: ZodType<T>, input: unknown): T {
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      const { fieldErrors, formErrors } = z.flattenError(parsed.error);
      throw new BadRequestException({
        code: 'validation_error',
        message: 'Request validation failed.',
        details: { fieldErrors, formErrors },
      });
    }

    return parsed.data;
  }
}
