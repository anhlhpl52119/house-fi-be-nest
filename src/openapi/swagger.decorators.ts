import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { z } from 'zod';

type OpenApiSchema = Record<string, unknown>;

type QuerySchemaObject = OpenApiSchema & {
  properties?: Record<string, OpenApiSchema>;
  required?: string[];
};

const ValidationErrorSchema: OpenApiSchema = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      enum: ['validation_error'],
    },
    message: {
      type: 'string',
      example: 'Request validation failed.',
    },
    details: {
      type: 'object',
      properties: {
        fieldErrors: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        formErrors: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      required: ['fieldErrors', 'formErrors'],
      additionalProperties: false,
    },
  },
  required: ['code', 'message', 'details'],
  additionalProperties: false,
};

export function ApiZodBody(schema: z.ZodType, description?: string): MethodDecorator {
  return ApiBody({
    description,
    required: true,
    schema: toOpenApiSchema(schema, 'input'),
  });
}

export function ApiZodParam(name: string, schema: z.ZodType, description?: string): MethodDecorator {
  return ApiParam({
    name,
    description,
    required: true,
    schema: toOpenApiSchema(schema, 'input'),
  });
}

export function ApiZodQuery(schema: z.ZodType): MethodDecorator {
  const openApiSchema = toOpenApiSchema(schema, 'input') as QuerySchemaObject;
  const properties = openApiSchema.properties ?? {};
  const required = new Set(openApiSchema.required ?? []);

  return applyDecorators(
    ...Object.entries(properties).map(([name, propertySchema]) =>
      ApiQuery({
        name,
        required: required.has(name),
        schema: propertySchema,
      }),
    ),
  );
}

export function ApiZodOkResponse(schema: z.ZodType, description?: string): MethodDecorator {
  return ApiOkResponse({
    description,
    schema: toEnvelopeSchema(schema),
  });
}

export function ApiZodCreatedResponse(schema: z.ZodType, description?: string): MethodDecorator {
  return ApiCreatedResponse({
    description,
    schema: toEnvelopeSchema(schema),
  });
}

export function ApiValidationErrorResponse(): MethodDecorator & ClassDecorator {
  return ApiBadRequestResponse({
    description: 'Request validation failed.',
    schema: ValidationErrorSchema,
  });
}

function toEnvelopeSchema(schema: z.ZodType): OpenApiSchema {
  return toOpenApiSchema(
    z.strictObject({
      data: schema,
    }),
  );
}

function toOpenApiSchema(schema: z.ZodType, io: 'input' | 'output' = 'output'): OpenApiSchema {
  return normalizeJsonSchema(z.toJSONSchema(schema, { io })) as OpenApiSchema;
}

function normalizeJsonSchema(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonSchema(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const normalizedEntries = Object.entries(value).flatMap(([key, entryValue]) => {
    if (key === '$schema') {
      return [];
    }

    return [[key, normalizeJsonSchema(entryValue)] as const];
  });

  const normalizedObject = Object.fromEntries(normalizedEntries) as OpenApiSchema;

  if (Array.isArray(normalizedObject.anyOf) && normalizedObject.anyOf.length === 2) {
    const nullableVariant = normalizedObject.anyOf.find(
      (item) => item && typeof item === 'object' && (item as OpenApiSchema).type === 'null',
    );
    const nonNullableVariant = normalizedObject.anyOf.find(
      (item) => item && typeof item === 'object' && (item as OpenApiSchema).type !== 'null',
    );

    if (nullableVariant && nonNullableVariant && typeof nonNullableVariant === 'object') {
      const merged = { ...(nonNullableVariant as OpenApiSchema), nullable: true };
      return normalizeJsonSchema(merged);
    }
  }

  return normalizedObject;
}
