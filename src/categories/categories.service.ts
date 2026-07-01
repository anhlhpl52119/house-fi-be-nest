import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { and, asc, eq, or } from 'drizzle-orm';

import { DATABASE } from '../database/database.constants.js';
import { Database } from '../database/database.types.js';
import { categories, Category, householdMembers, households } from '../database/schema.js';
import { CreateCategoryRequest, ListCategoriesQuery, UpdateCategoryRequest } from './categories.schemas.js';
import { CategoryResponse, CategoryType, CurrentHouseholdMembership } from './categories.types.js';

@Injectable()
export class CategoriesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async listCategories(requesterUserId: string, query: ListCategoriesQuery): Promise<CategoryResponse[]> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const conditions = [
      eq(categories.isActive, true),
      or(eq(categories.isSystem, true), eq(categories.householdId, membership.householdId)),
    ];

    if (query.type) {
      conditions.push(eq(categories.type, query.type));
    }

    const rows = await this.db
      .select()
      .from(categories)
      .where(and(...conditions))
      .orderBy(asc(categories.type), asc(categories.parentId), asc(categories.sortOrder), asc(categories.name));

    return rows.map((row) => this.toCategoryResponse(row));
  }

  async createCategory(requesterUserId: string, input: CreateCategoryRequest): Promise<CategoryResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);

    await this.validateParent({
      householdId: membership.householdId,
      parentId: input.parentId ?? null,
      type: input.type,
    });

    const [created] = await this.db
      .insert(categories)
      .values({
        householdId: membership.householdId,
        createdByUserId: requesterUserId,
        parentId: input.parentId ?? null,
        name: input.name,
        type: input.type,
        icon: input.icon ?? null,
        backgroundColor: input.backgroundColor ?? null,
        textColor: input.textColor ?? null,
        borderColor: input.borderColor ?? null,
        description: input.description ?? null,
        sortOrder: input.sortOrder ?? 0,
        isSystem: false,
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create category.');
    }

    return this.toCategoryResponse(created);
  }

  async updateCategory(requesterUserId: string, categoryId: string, input: UpdateCategoryRequest): Promise<CategoryResponse> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const category = await this.findAccessibleCategory(membership.householdId, categoryId);

    this.assertMutableCategory(category);

    const hasChildren = await this.hasActiveChildren(category.id);
    const nextType = input.type ?? this.toCategoryType(category.type);
    const nextParentId = input.parentId === undefined ? category.parentId : input.parentId;

    if (nextParentId === category.id) {
      throw new BadRequestException('A category cannot be its own parent.');
    }

    if (hasChildren && nextParentId) {
      throw new BadRequestException('A parent category cannot become a child category while it has children.');
    }

    if (hasChildren && input.type && input.type !== category.type) {
      throw new BadRequestException('A category with children cannot change type.');
    }

    await this.validateParent({
      householdId: membership.householdId,
      parentId: nextParentId,
      type: nextType,
    });

    const updates: Partial<typeof categories.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) {
      updates.name = input.name;
    }

    if (input.type !== undefined) {
      updates.type = input.type;
    }

    if (input.parentId !== undefined) {
      updates.parentId = input.parentId;
    }

    if (input.icon !== undefined) {
      updates.icon = input.icon;
    }

    if (input.backgroundColor !== undefined) {
      updates.backgroundColor = input.backgroundColor;
    }

    if (input.textColor !== undefined) {
      updates.textColor = input.textColor;
    }

    if (input.borderColor !== undefined) {
      updates.borderColor = input.borderColor;
    }

    if (input.description !== undefined) {
      updates.description = input.description;
    }

    if (input.sortOrder !== undefined) {
      updates.sortOrder = input.sortOrder;
    }

    const [updated] = await this.db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, category.id))
      .returning();

    if (!updated) {
      throw new Error('Failed to update category.');
    }

    return this.toCategoryResponse(updated);
  }

  async deleteCategory(requesterUserId: string, categoryId: string): Promise<void> {
    const membership = await this.resolveCurrentMembership(requesterUserId);
    const category = await this.findAccessibleCategory(membership.householdId, categoryId);

    this.assertMutableCategory(category);

    if (await this.hasActiveChildren(category.id)) {
      throw new BadRequestException('A category with active children cannot be deleted.');
    }

    await this.db
      .update(categories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(categories.id, category.id));
  }

  private async resolveCurrentMembership(userId: string): Promise<CurrentHouseholdMembership> {
    const [row] = await this.db
      .select({
        householdId: households.id,
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
      role: this.toMemberRole(row.role),
    };
  }

  private async findAccessibleCategory(householdId: string, categoryId: string): Promise<Category> {
    const [category] = await this.db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, categoryId),
          eq(categories.isActive, true),
          or(eq(categories.isSystem, true), eq(categories.householdId, householdId)),
        ),
      )
      .limit(1);

    if (!category) {
      throw new NotFoundException('Category was not found.');
    }

    return category;
  }

  private async validateParent(input: { householdId: string; parentId: string | null; type: CategoryType }): Promise<void> {
    if (!input.parentId) {
      return;
    }

    const parent = await this.findAccessibleCategory(input.householdId, input.parentId);

    if (parent.type !== input.type) {
      throw new BadRequestException('Parent category must have the same type.');
    }

    if (parent.parentId) {
      throw new BadRequestException('Category hierarchy supports only two levels.');
    }
  }

  private async hasActiveChildren(categoryId: string): Promise<boolean> {
    const [child] = await this.db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.parentId, categoryId), eq(categories.isActive, true)))
      .limit(1);

    return Boolean(child);
  }

  private assertMutableCategory(category: Category): void {
    if (category.isSystem) {
      throw new ForbiddenException('System categories cannot be modified.');
    }
  }

  private toCategoryResponse(category: Category): CategoryResponse {
    return {
      id: category.id,
      householdId: category.householdId,
      parentId: category.parentId,
      name: category.name,
      type: this.toCategoryType(category.type),
      icon: category.icon,
      backgroundColor: category.backgroundColor,
      textColor: category.textColor,
      borderColor: category.borderColor,
      description: category.description,
      isSystem: category.isSystem,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  private toCategoryType(type: string): CategoryType {
    if (type === 'income' || type === 'expense') {
      return type;
    }

    throw new Error(`Unsupported category type: ${type}`);
  }

  private toMemberRole(role: string): 'owner' | 'member' {
    if (role === 'owner' || role === 'member') {
      return role;
    }

    throw new Error(`Unsupported household member role: ${role}`);
  }
}
