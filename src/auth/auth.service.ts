import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import * as argon2 from 'argon2';

import { ConfigService } from '../config/config.service.js';
import { DATABASE } from '../database/database.constants.js';
import { Database } from '../database/database.types.js';
import { householdMembers, households, refreshTokens, User, users } from '../database/schema.js';
import { AccessTokenPayload, AccessTokenPayloadSchema, LoginRequest, RegisterRequest } from './auth.schemas.js';
import { AuthHouseholdResponse, AuthSessionResponse, AuthTokensResponse, AuthUserResponse, CurrentIdentityResponse } from './auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly config: ConfigService,
  ) {}

  async register(input: RegisterRequest): Promise<AuthSessionResponse> {
    const existingUser = await this.findUserByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await argon2.hash(input.password);
    const issuedTokens = this.issueTokens();
    const refreshTokenHash = this.hashRefreshToken(issuedTokens.refreshToken);
    const refreshTokenExpiresAt = this.refreshTokenExpiresAt();

    const created = await this.db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: input.email,
          passwordHash,
          displayName: input.displayName,
        })
        .returning();

      if (!user) {
        throw new Error('Failed to create user.');
      }

      const [household] = await tx
        .insert(households)
        .values({
          name: `${input.displayName} Household`,
          createdByUserId: user.id,
        })
        .returning();

      if (!household) {
        throw new Error('Failed to create household.');
      }

      const [membership] = await tx
        .insert(householdMembers)
        .values({
          householdId: household.id,
          userId: user.id,
          role: 'owner',
        })
        .returning();

      if (!membership) {
        throw new Error('Failed to create household membership.');
      }

      await tx.insert(refreshTokens).values({
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: refreshTokenExpiresAt,
      });

      return {
        user,
        household: {
          id: household.id,
          name: household.name,
          role: membership.role,
        },
      };
    });

    return {
      user: this.toUserResponse(created.user),
      household: created.household,
      tokens: this.attachAccessToken(issuedTokens, created.user),
    };
  }

  async login(input: LoginRequest): Promise<AuthSessionResponse> {
    const user = await this.findUserByEmail(input.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, input.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const household = await this.resolveCurrentHousehold(user.id);
    const tokens = this.attachAccessToken(this.issueTokens(), user);

    await this.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: this.hashRefreshToken(tokens.refreshToken),
      expiresAt: this.refreshTokenExpiresAt(),
    });

    return {
      user: this.toUserResponse(user),
      household,
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthSessionResponse> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const [tokenRow] = await this.db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt), gt(refreshTokens.expiresAt, new Date())))
      .limit(1);

    if (!tokenRow) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.findActiveUserById(tokenRow.userId);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const household = await this.resolveCurrentHousehold(user.id);
    const nextTokens = this.attachAccessToken(this.issueTokens(), user);
    const nextRefreshTokenHash = this.hashRefreshToken(nextTokens.refreshToken);
    const nextRefreshTokenExpiresAt = this.refreshTokenExpiresAt();

    await this.db.transaction(async (tx) => {
      await tx.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, tokenRow.id));
      await tx.insert(refreshTokens).values({
        userId: user.id,
        tokenHash: nextRefreshTokenHash,
        expiresAt: nextRefreshTokenExpiresAt,
      });
    });

    return {
      user: this.toUserResponse(user),
      household,
      tokens: nextTokens,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.tokenHash, this.hashRefreshToken(refreshToken)), isNull(refreshTokens.revokedAt)));
  }

  async getCurrentIdentity(userId: string): Promise<CurrentIdentityResponse> {
    const user = await this.findActiveUserById(userId);

    if (!user) {
      throw new UnauthorizedException('Invalid access token.');
    }

    return {
      user: this.toUserResponse(user),
      household: await this.resolveCurrentHousehold(user.id),
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      throw new UnauthorizedException('Invalid access token.');
    }

    const expectedSignature = this.signJwtParts(encodedHeader, encodedPayload);

    if (!this.safeEqual(encodedSignature, expectedSignature)) {
      throw new UnauthorizedException('Invalid access token.');
    }

    const parsed = AccessTokenPayloadSchema.safeParse(this.decodeBase64UrlJson(encodedPayload));

    if (!parsed.success || parsed.data.exp <= this.nowSeconds()) {
      throw new UnauthorizedException('Invalid access token.');
    }

    return parsed.data;
  }

  private async findUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  }

  private async findActiveUserById(userId: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.isActive, true)))
      .limit(1);

    return user;
  }

  private async resolveCurrentHousehold(userId: string): Promise<AuthHouseholdResponse> {
    const [row] = await this.db
      .select({
        id: households.id,
        name: households.name,
        role: householdMembers.role,
      })
      .from(householdMembers)
      .innerJoin(households, eq(householdMembers.householdId, households.id))
      .where(and(eq(householdMembers.userId, userId), eq(householdMembers.isActive, true)))
      .limit(1);

    if (!row) {
      throw new UnauthorizedException('User has no active household membership.');
    }

    return row;
  }

  private toUserResponse(user: User): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  }

  private issueTokens(): Pick<AuthTokensResponse, 'refreshToken' | 'tokenType'> {
    return {
      refreshToken: randomBytes(32).toString('base64url'),
      tokenType: 'Bearer',
    };
  }

  private attachAccessToken(tokens: Pick<AuthTokensResponse, 'refreshToken' | 'tokenType'>, user: User): AuthTokensResponse {
    return {
      accessToken: this.signAccessToken(user),
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType,
    };
  }

  private signAccessToken(user: User): string {
    const now = this.nowSeconds();
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      iat: now,
      exp: now + this.parseDurationSeconds(this.config.env.JWT_ACCESS_EXPIRES_IN),
    };
    const encodedHeader = this.encodeBase64UrlJson({ alg: 'HS256', typ: 'JWT' });
    const encodedPayload = this.encodeBase64UrlJson(payload);
    const signature = this.signJwtParts(encodedHeader, encodedPayload);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private signJwtParts(encodedHeader: string, encodedPayload: string): string {
    return createHmac('sha256', this.config.env.JWT_ACCESS_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
  }

  private hashRefreshToken(refreshToken: string): string {
    return createHmac('sha256', this.config.env.JWT_REFRESH_SECRET).update(refreshToken).digest('hex');
  }

  private refreshTokenExpiresAt(): Date {
    return new Date(Date.now() + this.parseDurationSeconds(this.config.env.JWT_REFRESH_EXPIRES_IN) * 1000);
  }

  private parseDurationSeconds(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value);

    if (!match) {
      throw new Error(`Unsupported duration value: ${value}`);
    }

    const amount = Number(match[1]);
    const unit = match[2];

    if (unit === 's') {
      return amount;
    }

    if (unit === 'm') {
      return amount * 60;
    }

    if (unit === 'h') {
      return amount * 60 * 60;
    }

    return amount * 60 * 60 * 24;
  }

  private nowSeconds(): number {
    return Math.floor(Date.now() / 1000);
  }

  private encodeBase64UrlJson(value: unknown): string {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private decodeBase64UrlJson(value: string): unknown {
    try {
      return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown;
    } catch {
      throw new UnauthorizedException('Invalid access token.');
    }
  }

  private safeEqual(left: string, right: string): boolean {
    const leftHash = createHash('sha256').update(left).digest();
    const rightHash = createHash('sha256').update(right).digest();
    return timingSafeEqual(leftHash, rightHash) && left === right;
  }
}
