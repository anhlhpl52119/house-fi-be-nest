# Health API

## `GET /health`

Unauthenticated smoke endpoint for platform checks.

### Response

```json
{
  "status": "ok",
  "timestamp": "2026-07-09T00:00:00.000Z"
}
```

Use this endpoint for liveness checks only. It does not verify database migrations or downstream providers.
