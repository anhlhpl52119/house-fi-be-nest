import { BadRequestException, Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { z, ZodType } from 'zod';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import {
  CashFlowQuery,
  CashFlowQuerySchema,
  MonthlySpendingQuery,
  MonthlySpendingQuerySchema,
  SavingsSummaryQuery,
  SavingsSummaryQuerySchema,
  UpcomingObligationsQuery,
  UpcomingObligationsQuerySchema,
} from './reports.schemas.js';
import { ReportsService } from './reports.service.js';
import {
  AssetSummaryReportResponse,
  CashFlowReportResponse,
  MonthlySpendingReportResponse,
  SavingsSummaryReportResponse,
  UpcomingObligationsReportResponse,
} from './reports.types.js';

@Controller('reports')
@UseGuards(AccessTokenGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly-spending')
  async getMonthlySpending(
    @Req() request: AuthenticatedRequest,
    @Query() query: unknown,
  ): Promise<{ data: MonthlySpendingReportResponse }> {
    return {
      data: await this.reportsService.getMonthlySpending(
        this.getAuthenticatedUserId(request),
        this.parseInput(MonthlySpendingQuerySchema, query),
      ),
    };
  }

  @Get('cash-flow')
  async getCashFlow(
    @Req() request: AuthenticatedRequest,
    @Query() query: unknown,
  ): Promise<{ data: CashFlowReportResponse }> {
    return {
      data: await this.reportsService.getCashFlow(
        this.getAuthenticatedUserId(request),
        this.parseInput(CashFlowQuerySchema, query),
      ),
    };
  }

  @Get('upcoming-obligations')
  async getUpcomingObligations(
    @Req() request: AuthenticatedRequest,
    @Query() query: unknown,
  ): Promise<{ data: UpcomingObligationsReportResponse }> {
    return {
      data: await this.reportsService.getUpcomingObligations(
        this.getAuthenticatedUserId(request),
        this.parseInput(UpcomingObligationsQuerySchema, query),
      ),
    };
  }

  @Get('assets/summary')
  async getAssetSummary(@Req() request: AuthenticatedRequest): Promise<{ data: AssetSummaryReportResponse }> {
    return {
      data: await this.reportsService.getAssetSummary(this.getAuthenticatedUserId(request)),
    };
  }

  @Get('savings/summary')
  async getSavingsSummary(
    @Req() request: AuthenticatedRequest,
    @Query() query: unknown,
  ): Promise<{ data: SavingsSummaryReportResponse }> {
    return {
      data: await this.reportsService.getSavingsSummary(
        this.getAuthenticatedUserId(request),
        this.parseInput(SavingsSummaryQuerySchema, query),
      ),
    };
  }

  private getAuthenticatedUserId(request: AuthenticatedRequest): string {
    if (!request.auth) {
      throw new BadRequestException('Authenticated request context is missing.');
    }

    return request.auth.userId;
  }

  private parseInput(schema: typeof MonthlySpendingQuerySchema, input: unknown): MonthlySpendingQuery;
  private parseInput(schema: typeof CashFlowQuerySchema, input: unknown): CashFlowQuery;
  private parseInput(schema: typeof UpcomingObligationsQuerySchema, input: unknown): UpcomingObligationsQuery;
  private parseInput(schema: typeof SavingsSummaryQuerySchema, input: unknown): SavingsSummaryQuery;
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
