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
  CreateInstallmentPlanRequest,
  CreateInstallmentPlanRequestSchema,
  InstallmentPaymentIdParamSchema,
  InstallmentPlanIdParamSchema,
  ListInstallmentPlansQuery,
  ListInstallmentPlansQuerySchema,
  ListUpcomingInstallmentPaymentsQuery,
  ListUpcomingInstallmentPaymentsQuerySchema,
  PayInstallmentPaymentRequest,
  PayInstallmentPaymentRequestSchema,
} from './installments.schemas.js';
import { InstallmentsService } from './installments.service.js';
import {
  InstallmentPaymentResponse,
  InstallmentPaymentResponseSchema,
  InstallmentPlanDetailResponse,
  InstallmentPlanDetailResponseSchema,
  InstallmentPlanResponse,
  InstallmentPlanResponseSchema,
} from './installments.types.js';

@ApiTags('installments')
@ApiBearerAuth('bearer')
@Controller('installments')
@UseGuards(AccessTokenGuard)
export class InstallmentsController {
  constructor(private readonly installmentsService: InstallmentsService) {}

  @Get('plans')
  @ApiZodQuery(ListInstallmentPlansQuerySchema)
  @ApiValidationErrorResponse()
  @ApiZodOkResponse(z.array(InstallmentPlanResponseSchema), 'Installment plans matching the filters.')
  async listPlans(@Req() request: AuthenticatedRequest, @Query() query: unknown): Promise<{ data: InstallmentPlanResponse[] }> {
    return {
      data: await this.installmentsService.listInstallmentPlans(
        this.getAuthenticatedUserId(request),
        this.parseInput(ListInstallmentPlansQuerySchema, query),
      ),
    };
  }

  @Post('plans')
  @ApiZodBody(CreateInstallmentPlanRequestSchema)
  @ApiValidationErrorResponse()
  @ApiZodCreatedResponse(InstallmentPlanDetailResponseSchema, 'Installment plan created.')
  async createPlan(@Req() request: AuthenticatedRequest, @Body() body: unknown): Promise<{ data: InstallmentPlanDetailResponse }> {
    return {
      data: await this.installmentsService.createInstallmentPlan(
        this.getAuthenticatedUserId(request),
        this.parseInput(CreateInstallmentPlanRequestSchema, body),
      ),
    };
  }

  @Get('plans/:id')
  @ApiZodParam('id', InstallmentPlanIdParamSchema, 'Installment plan identifier.')
  @ApiValidationErrorResponse()
  @ApiZodOkResponse(InstallmentPlanDetailResponseSchema, 'Installment plan detail.')
  async getPlan(@Req() request: AuthenticatedRequest, @Param('id') id: unknown): Promise<{ data: InstallmentPlanDetailResponse }> {
    return {
      data: await this.installmentsService.getInstallmentPlan(
        this.getAuthenticatedUserId(request),
        this.parseInput(InstallmentPlanIdParamSchema, id),
      ),
    };
  }

  @Get('payments/upcoming')
  @ApiZodQuery(ListUpcomingInstallmentPaymentsQuerySchema)
  @ApiValidationErrorResponse()
  @ApiZodOkResponse(z.array(InstallmentPaymentResponseSchema), 'Upcoming installment payments.')
  async listUpcomingPayments(
    @Req() request: AuthenticatedRequest,
    @Query() query: unknown,
  ): Promise<{ data: InstallmentPaymentResponse[] }> {
    return {
      data: await this.installmentsService.listUpcomingInstallmentPayments(
        this.getAuthenticatedUserId(request),
        this.parseInput(ListUpcomingInstallmentPaymentsQuerySchema, query),
      ),
    };
  }

  @Post('payments/:id/pay')
  @ApiZodParam('id', InstallmentPaymentIdParamSchema, 'Installment payment identifier.')
  @ApiZodBody(PayInstallmentPaymentRequestSchema)
  @ApiValidationErrorResponse()
  @ApiZodCreatedResponse(InstallmentPaymentResponseSchema, 'Installment payment settled.')
  async payInstallment(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: unknown,
    @Body() body: unknown,
  ): Promise<{ data: InstallmentPaymentResponse }> {
    return {
      data: await this.installmentsService.payInstallmentPayment(
        this.getAuthenticatedUserId(request),
        this.parseInput(InstallmentPaymentIdParamSchema, id),
        this.parseInput(PayInstallmentPaymentRequestSchema, body),
      ),
    };
  }

  private getAuthenticatedUserId(request: AuthenticatedRequest): string {
    if (!request.auth) {
      throw new BadRequestException('Authenticated request context is missing.');
    }

    return request.auth.userId;
  }

  private parseInput(schema: typeof ListInstallmentPlansQuerySchema, input: unknown): ListInstallmentPlansQuery;
  private parseInput(schema: typeof CreateInstallmentPlanRequestSchema, input: unknown): CreateInstallmentPlanRequest;
  private parseInput(schema: typeof InstallmentPlanIdParamSchema, input: unknown): string;
  private parseInput(schema: typeof ListUpcomingInstallmentPaymentsQuerySchema, input: unknown): ListUpcomingInstallmentPaymentsQuery;
  private parseInput(schema: typeof InstallmentPaymentIdParamSchema, input: unknown): string;
  private parseInput(schema: typeof PayInstallmentPaymentRequestSchema, input: unknown): PayInstallmentPaymentRequest;
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
