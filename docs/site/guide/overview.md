# Overview

This documentation site is the human-readable companion to the runtime Swagger document. Use it to understand how the implemented API groups fit together and which product rules must stay true.

## Base paths

Business endpoints use the global `/api/v1` prefix. This site lists controller routes such as `/auth/register`, `/households/current`, and `/reports/monthly-spending`; call them as `/api/v1/auth/register`, `/api/v1/households/current`, and `/api/v1/reports/monthly-spending`.

The health endpoint is excluded from the business prefix and remains `GET /health`. Swagger UI is exposed at `/api/docs`, with OpenAPI JSON at `/api/docs-json`.

## Response envelope

Most successful API responses use a `data` envelope:

```json
{
  "data": { "id": "..." }
}
```

List endpoints return arrays in the same envelope:

```json
{
  "data": []
}
```

`204 No Content` endpoints return an empty body.

## Validation errors

Request bodies, path params, and query params are parsed with Zod. Invalid input returns a validation error shaped like:

```json
{
  "code": "validation_error",
  "message": "Request validation failed.",
  "details": {
    "fieldErrors": {},
    "formErrors": []
  }
}
```

## Documentation map

- [Authentication](./authentication.md): token lifecycle and bearer auth.
- [API conventions](./api-conventions.md): shared field formats and status behavior.
- [API reference](/api/): endpoint groups and domain-specific rules.
- [Product context](/product-context.md): product and financial semantics.
