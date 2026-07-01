import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { z, ZodType } from 'zod';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import {
  CreateSavingDepositRequest,
  CreateSavingDepositRequestSchema,
  ListSavingDepositsQuery,
  ListSavingDepositsQuerySchema,
  MatureSavingDepositRequest,
  MatureSavingDepositRequestSchema,
  SavingDepositIdParamSchema,
} from './savings.schemas.js';
import { SavingsService } from './savings.service.js';
import { SavingDepositResponse } from './savings.types.js';

@Controller('savings/deposits')
@UseGuards(AccessTokenGuard)
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @Get()
  async listSavingDeposits(
    @Req() request: AuthenticatedRequest,
    @Query() query: unknown,
  ): Promise<{ data: SavingDepositResponse[] }> {
    return {
      data: await this.savingsService.listSavingDeposits(
        this.getAuthenticatedUserId(request),
        this.parseInput(ListSavingDepositsQuerySchema, query),
      ),
    };
  }

  @Post()
  async createSavingDeposit(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<{ data: SavingDepositResponse }> {
    return {
      data: await this.savingsService.createSavingDeposit(
        this.getAuthenticatedUserId(request),
        this.parseInput(CreateSavingDepositRequestSchema, body),
      ),
    };
  }

  @Get(':id')
  async getSavingDeposit(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: unknown,
  ): Promise<{ data: SavingDepositResponse }> {
    return {
      data: await this.savingsService.getSavingDeposit(
        this.getAuthenticatedUserId(request),
        this.parseInput(SavingDepositIdParamSchema, id),
      ),
    };
  }

  @Post(':id/mature')
  async matureSavingDeposit(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: unknown,
    @Body() body: unknown,
  ): Promise<{ data: SavingDepositResponse }> {
    return {
      data: await this.savingsService.matureSavingDeposit(
        this.getAuthenticatedUserId(request),
        this.parseInput(SavingDepositIdParamSchema, id),
        this.parseInput(MatureSavingDepositRequestSchema, body),
      ),
    };
  }

  private getAuthenticatedUserId(request: AuthenticatedRequest): string {
    if (!request.auth) {
      throw new BadRequestException('Authenticated request context is missing.');
    }

    return request.auth.userId;
  }

  private parseInput(schema: typeof ListSavingDepositsQuerySchema, input: unknown): ListSavingDepositsQuery;
  private parseInput(schema: typeof CreateSavingDepositRequestSchema, input: unknown): CreateSavingDepositRequest;
  private parseInput(schema: typeof MatureSavingDepositRequestSchema, input: unknown): MatureSavingDepositRequest;
  private parseInput(schema: typeof SavingDepositIdParamSchema, input: unknown): string;
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
