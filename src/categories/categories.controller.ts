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
  CategoryIdParamSchema,
  CreateCategoryRequest,
  CreateCategoryRequestSchema,
  ListCategoriesQuery,
  ListCategoriesQuerySchema,
  UpdateCategoryRequest,
  UpdateCategoryRequestSchema,
} from './categories.schemas.js';
import { CategoriesService } from './categories.service.js';
import { CategoryResponse, CategoryResponseSchema } from './categories.types.js';

@ApiTags('categories')
@ApiBearerAuth('bearer')
@Controller('categories')
@UseGuards(AccessTokenGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiZodQuery(ListCategoriesQuerySchema)
  @ApiValidationErrorResponse()
  @ApiZodOkResponse(z.array(CategoryResponseSchema), 'Accessible system and household categories.')
  async listCategories(@Req() request: AuthenticatedRequest, @Query() query: unknown): Promise<{ data: CategoryResponse[] }> {
    return {
      data: await this.categoriesService.listCategories(this.getAuthenticatedUserId(request), this.parseInput(ListCategoriesQuerySchema, query)),
    };
  }

  @Post()
  @ApiZodBody(CreateCategoryRequestSchema)
  @ApiValidationErrorResponse()
  @ApiZodCreatedResponse(CategoryResponseSchema, 'Category created.')
  async createCategory(@Req() request: AuthenticatedRequest, @Body() body: unknown): Promise<{ data: CategoryResponse }> {
    return {
      data: await this.categoriesService.createCategory(this.getAuthenticatedUserId(request), this.parseInput(CreateCategoryRequestSchema, body)),
    };
  }

  @Patch(':id')
  @ApiZodParam('id', CategoryIdParamSchema, 'Category identifier.')
  @ApiZodBody(UpdateCategoryRequestSchema)
  @ApiValidationErrorResponse()
  @ApiZodOkResponse(CategoryResponseSchema, 'Category updated.')
  async updateCategory(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: unknown,
    @Body() body: unknown,
  ): Promise<{ data: CategoryResponse }> {
    return {
      data: await this.categoriesService.updateCategory(
        this.getAuthenticatedUserId(request),
        this.parseInput(CategoryIdParamSchema, id),
        this.parseInput(UpdateCategoryRequestSchema, body),
      ),
    };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiZodParam('id', CategoryIdParamSchema, 'Category identifier.')
  @ApiValidationErrorResponse()
  @ApiNoContentResponse({ description: 'Category deleted.' })
  async deleteCategory(@Req() request: AuthenticatedRequest, @Param('id') id: unknown): Promise<void> {
    await this.categoriesService.deleteCategory(this.getAuthenticatedUserId(request), this.parseInput(CategoryIdParamSchema, id));
  }

  private getAuthenticatedUserId(request: AuthenticatedRequest): string {
    if (!request.auth) {
      throw new BadRequestException('Authenticated request context is missing.');
    }

    return request.auth.userId;
  }

  private parseInput(schema: typeof ListCategoriesQuerySchema, input: unknown): ListCategoriesQuery;
  private parseInput(schema: typeof CreateCategoryRequestSchema, input: unknown): CreateCategoryRequest;
  private parseInput(schema: typeof UpdateCategoryRequestSchema, input: unknown): UpdateCategoryRequest;
  private parseInput(schema: typeof CategoryIdParamSchema, input: unknown): string;
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
