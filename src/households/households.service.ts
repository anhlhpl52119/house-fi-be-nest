import { ConflictException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import * as argon2 from 'argon2';

import { DATABASE } from '../database/database.constants.js';
import { Database } from '../database/database.types.js';
import { householdMembers, households, users } from '../database/schema.js';
import { CreateHouseholdMemberRequest } from './households.schemas.js';
import { CurrentHouseholdMembership, HouseholdMemberResponse } from './households.types.js';

@Injectable()
export class HouseholdsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async createMember(requesterUserId: string, input: CreateHouseholdMemberRequest): Promise<HouseholdMemberResponse> {
    const requesterMembership = await this.resolveCurrentMembership(requesterUserId);

    if (requesterMembership.role !== 'owner') {
      throw new ForbiddenException('Only household owners can create members.');
    }

    const passwordHash = await argon2.hash(input.password);

    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select id from households where id = ${requesterMembership.householdId} for update`);

      const activeMembers = await tx
        .select({ id: householdMembers.id })
        .from(householdMembers)
        .where(and(eq(householdMembers.householdId, requesterMembership.householdId), eq(householdMembers.isActive, true)))
        .limit(2);

      if (activeMembers.length >= 2) {
        throw new ConflictException('Household already has the maximum two active members.');
      }

      const [existingUser] = await tx.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);

      if (existingUser) {
        throw new ConflictException('Email is already registered.');
      }

      const [user] = await tx
        .insert(users)
        .values({
          email: input.email,
          passwordHash,
          displayName: input.displayName,
        })
        .returning({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        });

      if (!user) {
        throw new Error('Failed to create household member user.');
      }

      const [membership] = await tx
        .insert(householdMembers)
        .values({
          householdId: requesterMembership.householdId,
          userId: user.id,
          role: 'member',
        })
        .returning({
          id: householdMembers.id,
          role: householdMembers.role,
          joinedAt: householdMembers.joinedAt,
        });

      if (!membership) {
        throw new Error('Failed to create household membership.');
      }

      return this.toMemberResponse({
        id: membership.id,
        role: membership.role,
        joinedAt: membership.joinedAt,
        user,
      });
    });
  }

  async listMembers(requesterUserId: string): Promise<HouseholdMemberResponse[]> {
    const requesterMembership = await this.resolveCurrentMembership(requesterUserId);

    const rows = await this.db
      .select({
        id: householdMembers.id,
        role: householdMembers.role,
        joinedAt: householdMembers.joinedAt,
        user: {
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(householdMembers)
      .innerJoin(users, eq(householdMembers.userId, users.id))
      .where(and(eq(householdMembers.householdId, requesterMembership.householdId), eq(householdMembers.isActive, true), eq(users.isActive, true)))
      .orderBy(asc(householdMembers.joinedAt), asc(users.email));

    return rows.map((row) => this.toMemberResponse(row));
  }

  private async resolveCurrentMembership(userId: string): Promise<CurrentHouseholdMembership> {
    const [row] = await this.db
      .select({
        householdId: households.id,
        householdName: households.name,
        role: householdMembers.role,
      })
      .from(householdMembers)
      .innerJoin(households, eq(householdMembers.householdId, households.id))
      .where(and(eq(householdMembers.userId, userId), eq(householdMembers.isActive, true)))
      .limit(1);

    if (!row) {
      throw new UnauthorizedException('User has no active household membership.');
    }

    return {
      householdId: row.householdId,
      householdName: row.householdName,
      role: this.toMemberRole(row.role),
    };
  }

  private toMemberResponse(row: {
    id: string;
    role: string;
    joinedAt: Date;
    user: {
      id: string;
      email: string;
      displayName: string;
      avatarUrl: string | null;
    };
  }): HouseholdMemberResponse {
    return {
      id: row.id,
      role: this.toMemberRole(row.role),
      joinedAt: row.joinedAt.toISOString(),
      user: row.user,
    };
  }

  private toMemberRole(role: string): 'owner' | 'member' {
    if (role === 'owner' || role === 'member') {
      return role;
    }

    throw new Error(`Unsupported household member role: ${role}`);
  }
}
