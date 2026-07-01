import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { z, ZodType } from 'zod';

import {
  ApiValidationErrorResponse,
  ApiZodBody,
  ApiZodCreatedResponse,
  ApiZodOkResponse,
  ApiZodParam,
  ApiZodQuery,
} from '../openapi/swagger.decorators.js';
import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import {
  CashTransactionIdParamSchema,
  CreateCashTransactionRequest,
  CreateCashTransactionRequestSchema,
  ListCashTransactionsQuery,
  ListCashTransactionsQuerySchema,
  UpdateCashTransactionRequest,
  UpdateCashTransactionRequestSchema,
} from './cash-transactions.schemas.js';
import { CashTransactionsService } from './cash-transactions.service.js';
import {
  CashBalanceResponse,
  CashBalanceResponseSchema,
  CashTransactionResponse,
  CashTransactionResponseSchema,
} from './cash-transactions.types.js';

@ApiTags('cash-transactions')
@ApiBearerAuth('bearer')
@Controller('cash-transactions')
@UseGuards(AccessTokenGuard)
export class CashTransactionsController {
  constructor(private readonly cashTransactionsService: CashTransactionsService) {}

  @Get()
  @ApiZodQuery(ListCashTransactionsQuerySchema)
  @ApiValidationErrorResponse()
  @ApiZodOkResponse(z.array(CashTransactionResponseSchema), 'Cash transactions matching the filters.')
  async listCashTransactions(@Req() request: AuthenticatedRequest, @Query() query: unknown): Promise<{ data: CashTransactionResponse[] }> {
    return {
      data: await this.cashTransactionsService.listCashTransactions(
        this.getAuthenticatedUserId(request),
        this.parseInput(ListCashTransactionsQuerySchema, query),
      ),
    };
  }

  @Get('balance')
  @ApiZodOkResponse(CashBalanceResponseSchema, 'Derived household cash balance.')
  async getCashBalance(@Req() request: AuthenticatedRequest): Promise<{ data: CashBalanceResponse }> {
    return {
      data: await this.cashTransactionsService.getCashBalance(this.getAuthenticatedUserId(request)),
    };
  }

  @Get(':id')
  @ApiZodParam('id', CashTransactionIdParamSchema, 'Cash transaction identifier.')
  @ApiValidationErrorResponse()
  @ApiZodOkResponse(CashTransactionResponseSchema, 'Cash transaction detail.')
  async getCashTransaction(@Req() request: AuthenticatedRequest, @Param('id') id: unknown): Promise<{ data: CashTransactionResponse }> {
    return {
      data: await this.cashTransactionsService.getCashTransaction(
        this.getAuthenticatedUserId(request),
        this.parseInput(CashTransactionIdParamSchema, id),
      ),
    };
  }

  @Post()
  @ApiZodBody(CreateCashTransactionRequestSchema)
  @ApiValidationErrorResponse()
  @ApiZodCreatedResponse(CashTransactionResponseSchema, 'Cash transaction created.')
  async createCashTransaction(@Req() request: AuthenticatedRequest, @Body() body: unknown): Promise<{ data: CashTransactionResponse }> {
    return {
      data: await this.cashTransactionsService.createCashTransaction(
        this.getAuthenticatedUserId(request),
        this.parseInput(CreateCashTransactionRequestSchema, body),
      ),
    };
  }

  @Patch(':id')
  @ApiZodParam('id', CashTransactionIdParamSchema, 'Cash transaction identifier.')
  @ApiZodBody(UpdateCashTransactionRequestSchema)
  @ApiValidationErrorResponse()
  @ApiZodOkResponse(CashTransactionResponseSchema, 'Cash transaction updated.')
  async updateCashTransaction(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: unknown,
    @Body() body: unknown,
  ): Promise<{ data: CashTransactionResponse }> {
    return {
      data: await this.cashTransactionsService.updateCashTransaction(
        this.getAuthenticatedUserId(request),
        this.parseInput(CashTransactionIdParamSchema, id),
        this.parseInput(UpdateCashTransactionRequestSchema, body),
      ),
    };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiZodParam('id', CashTransactionIdParamSchema, 'Cash transaction identifier.')
  @ApiValidationErrorResponse()
  @ApiNoContentResponse({ description: 'Cash transaction deleted.' })
  async deleteCashTransaction(@Req() request: AuthenticatedRequest, @Param('id') id: unknown): Promise<void> {
    await this.cashTransactionsService.deleteCashTransaction(
      this.getAuthenticatedUserId(request),
      this.parseInput(CashTransactionIdParamSchema, id),
    );
  }

  private getAuthenticatedUserId(request: AuthenticatedRequest): string {
    if (!request.auth) {
      throw new BadRequestException('Authenticated request context is missing.');
    }

    return request.auth.userId;
  }

  private parseInput(schema: typeof ListCashTransactionsQuerySchema, input: unknown): ListCashTransactionsQuery;
  private parseInput(schema: typeof CreateCashTransactionRequestSchema, input: unknown): CreateCashTransactionRequest;
  private parseInput(schema: typeof UpdateCashTransactionRequestSchema, input: unknown): UpdateCashTransactionRequest;
  private parseInput(schema: typeof CashTransactionIdParamSchema, input: unknown): string;
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
