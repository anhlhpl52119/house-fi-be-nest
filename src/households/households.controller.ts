import { BadRequestException, Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { z, ZodType } from 'zod';

import {
  ApiValidationErrorResponse,
  ApiZodBody,
  ApiZodCreatedResponse,
  ApiZodOkResponse,
} from '../openapi/swagger.decorators.js';
import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { AuthenticatedRequest } from '../auth/auth.types.js';
import {
  CreateHouseholdMemberRequest,
  CreateHouseholdMemberRequestSchema,
  UpdateCurrentHouseholdRequest,
  UpdateCurrentHouseholdRequestSchema,
} from './households.schemas.js';
import { HouseholdsService } from './households.service.js';
import {
  CurrentHouseholdResponse,
  CurrentHouseholdResponseSchema,
  HouseholdMemberResponse,
  HouseholdMemberResponseSchema,
} from './households.types.js';

@ApiTags('households')
@ApiBearerAuth('bearer')
@Controller('households')
@UseGuards(AccessTokenGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Get('current')
  @ApiZodOkResponse(CurrentHouseholdResponseSchema, 'Current authenticated household context.')
  async getCurrent(@Req() request: AuthenticatedRequest): Promise<{ data: CurrentHouseholdResponse }> {
    return {
      data: await this.householdsService.getCurrentHousehold(this.getAuthenticatedUserId(request)),
    };
  }

  @Patch('current')
  @ApiZodBody(UpdateCurrentHouseholdRequestSchema)
  @ApiValidationErrorResponse()
  @ApiZodOkResponse(CurrentHouseholdResponseSchema, 'Current household updated.')
  async updateCurrent(@Req() request: AuthenticatedRequest, @Body() body: unknown): Promise<{ data: CurrentHouseholdResponse }> {
    return {
      data: await this.householdsService.updateCurrentHousehold(
        this.getAuthenticatedUserId(request),
        this.parseBody(UpdateCurrentHouseholdRequestSchema, body),
      ),
    };
  }

  @Get('members')
  @ApiZodOkResponse(z.array(HouseholdMemberResponseSchema), 'Active household members.')
  async listMembers(@Req() request: AuthenticatedRequest): Promise<{ data: HouseholdMemberResponse[] }> {
    return {
      data: await this.householdsService.listMembers(this.getAuthenticatedUserId(request)),
    };
  }

  @Post('members')
  @ApiZodBody(CreateHouseholdMemberRequestSchema)
  @ApiValidationErrorResponse()
  @ApiZodCreatedResponse(HouseholdMemberResponseSchema, 'Household member created.')
  async createMember(@Req() request: AuthenticatedRequest, @Body() body: unknown): Promise<{ data: HouseholdMemberResponse }> {
    return {
      data: await this.householdsService.createMember(this.getAuthenticatedUserId(request), this.parseBody(CreateHouseholdMemberRequestSchema, body)),
    };
  }

  private getAuthenticatedUserId(request: AuthenticatedRequest): string {
    if (!request.auth) {
      throw new BadRequestException('Authenticated request context is missing.');
    }

    return request.auth.userId;
  }

  private parseBody(schema: typeof CreateHouseholdMemberRequestSchema, body: unknown): CreateHouseholdMemberRequest;
  private parseBody(schema: typeof UpdateCurrentHouseholdRequestSchema, body: unknown): UpdateCurrentHouseholdRequest;
  private parseBody<T>(schema: ZodType<T>, body: unknown): T {
    const parsed = schema.safeParse(body);

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
