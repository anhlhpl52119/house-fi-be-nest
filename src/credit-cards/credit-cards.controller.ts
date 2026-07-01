import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
import {
  CreditCardPaymentResponse,
  CreditCardPaymentResponseSchema,
  CreditCardTransactionResponse,
  CreditCardTransactionResponseSchema,
} from './credit-cards.types.js';

@ApiTags('credit-cards')
@ApiBearerAuth('bearer')
@Controller('credit-cards')
@UseGuards(AccessTokenGuard)
export class CreditCardsController {
  constructor(private readonly creditCardsService: CreditCardsService) {}

  @Get('transactions')
  @ApiZodQuery(ListCreditCardTransactionsQuerySchema)
  @ApiValidationErrorResponse()
  @ApiZodOkResponse(z.array(CreditCardTransactionResponseSchema), 'Credit-card transactions matching the filters.')
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
  @ApiZodBody(CreateCreditCardTransactionRequestSchema)
  @ApiValidationErrorResponse()
  @ApiZodCreatedResponse(CreditCardTransactionResponseSchema, 'Credit-card transaction created.')
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
  @ApiZodParam('id', CreditCardTransactionIdParamSchema, 'Credit-card transaction identifier.')
  @ApiZodBody(ResolveCreditCardTransactionRequestSchema)
  @ApiValidationErrorResponse()
  @ApiZodCreatedResponse(CreditCardPaymentResponseSchema, 'Credit-card payment created.')
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
  @ApiZodQuery(ListCreditCardPaymentsQuerySchema)
  @ApiValidationErrorResponse()
  @ApiZodOkResponse(z.array(CreditCardPaymentResponseSchema), 'Credit-card payments matching the filters.')
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
