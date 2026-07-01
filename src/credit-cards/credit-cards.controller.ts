import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { z, ZodType } from 'zod';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import {
  CreateCreditCardTransactionRequest,
  CreateCreditCardTransactionRequestSchema,
  CreditCardTransactionIdParamSchema,
  ListCreditCardPaymentsQuery,
  ListCreditCardPaymentsQuerySchema,
  ListCreditCardTransactionsQuery,
  ListCreditCardTransactionsQuerySchema,
  ResolveCreditCardTransactionRequest,
  ResolveCreditCardTransactionRequestSchema,
} from './credit-cards.schemas.js';
import { CreditCardsService } from './credit-cards.service.js';
import { CreditCardPaymentResponse, CreditCardTransactionResponse } from './credit-cards.types.js';

@Controller('credit-cards')
@UseGuards(AccessTokenGuard)
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @Get('transactions')
  async listTransactions(
    @Req() request: AuthenticatedRequest,
    @Query() query: unknown,
  ): Promise<{ data: CreditCardTransactionResponse[] }> {
    return {
      data: await this.creditCardsService.listCreditCardTransactions(
        this.getAuthenticatedUserId(request),
        this.parseInput(ListCreditCardTransactionsQuerySchema, query),
      ),
    };
  }

  @Post('transactions')
  async createTransaction(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ): Promise<{ data: CreditCardTransactionResponse }> {
    return {
      data: await this.creditCardsService.createCreditCardTransaction(
        this.getAuthenticatedUserId(request),
        this.parseInput(CreateCreditCardTransactionRequestSchema, body),
      ),
    };
  }

  @Post('transactions/:id/resolve')
  async resolveTransaction(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: unknown,
    @Body() body: unknown,
  ): Promise<{ data: CreditCardPaymentResponse }> {
    return {
      data: await this.creditCardsService.resolveCreditCardTransaction(
        this.getAuthenticatedUserId(request),
        this.parseInput(CreditCardTransactionIdParamSchema, id),
        this.parseInput(ResolveCreditCardTransactionRequestSchema, body),
      ),
    };
  }

  @Get('payments')
  async listPayments(@Req() request: AuthenticatedRequest, @Query() query: unknown): Promise<{ data: CreditCardPaymentResponse[] }> {
    return {
      data: await this.creditCardsService.listCreditCardPayments(
        this.getAuthenticatedUserId(request),
        this.parseInput(ListCreditCardPaymentsQuerySchema, query),
      ),
    };
  }

  private getAuthenticatedUserId(request: AuthenticatedRequest): string {
    if (!request.auth) {
      throw new BadRequestException('Authenticated request context is missing.');
    }

    return request.auth.userId;
  }

  private parseInput(schema: typeof ListCreditCardTransactionsQuerySchema, input: unknown): ListCreditCardTransactionsQuery;
  private parseInput(schema: typeof CreateCreditCardTransactionRequestSchema, input: unknown): CreateCreditCardTransactionRequest;
  private parseInput(schema: typeof ResolveCreditCardTransactionRequestSchema, input: unknown): ResolveCreditCardTransactionRequest;
  private parseInput(schema: typeof ListCreditCardPaymentsQuerySchema, input: unknown): ListCreditCardPaymentsQuery;
  private parseInput(schema: typeof CreditCardTransactionIdParamSchema, input: unknown): string;
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
