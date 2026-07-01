import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiTags } from '@nestjs/swagger';
import { z, ZodType } from 'zod';

import { AccessTokenGuard } from './access-token.guard.js';
import { LoginRequest, LoginRequestSchema, RefreshTokenRequest, RefreshTokenRequestSchema, RegisterRequest, RegisterRequestSchema } from './auth.schemas.js';
import { AuthService } from './auth.service.js';
import { AuthenticatedRequest, AuthSessionResponse, CurrentIdentityResponse } from './auth.types.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: unknown): Promise<{ data: AuthSessionResponse }> {
    return {
      data: await this.authService.register(this.parseBody(RegisterRequestSchema, body)),
    };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown): Promise<{ data: AuthSessionResponse }> {
    return {
      data: await this.authService.login(this.parseBody(LoginRequestSchema, body)),
    };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: unknown): Promise<{ data: AuthSessionResponse }> {
    const input = this.parseBody(RefreshTokenRequestSchema, body);

    return {
      data: await this.authService.refresh(input.refreshToken),
    };
  }

  @Post('logout')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Refresh token invalidated.' })
  async logout(@Body() body: unknown): Promise<void> {
    const input = this.parseBody(RefreshTokenRequestSchema, body);
    await this.authService.logout(input.refreshToken);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('bearer')
  async me(@Req() request: AuthenticatedRequest): Promise<{ data: CurrentIdentityResponse }> {
    if (!request.auth) {
      throw new BadRequestException('Authenticated request context is missing.');
    }

    return {
      data: await this.authService.getCurrentIdentity(request.auth.userId),
    };
  }

  private parseBody(schema: typeof RegisterRequestSchema, body: unknown): RegisterRequest;
  private parseBody(schema: typeof LoginRequestSchema, body: unknown): LoginRequest;
  private parseBody(schema: typeof RefreshTokenRequestSchema, body: unknown): RefreshTokenRequest;
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
