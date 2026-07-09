# Auth API

Auth routes are public except `GET /auth/me`.

## `POST /auth/register`

Creates a user, default household, owner membership, and session.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | Valid email; normalized to lowercase |
| `password` | string | 8-128 chars |
| `displayName` | string | 1-120 trimmed chars |

### Response

`201 Created` with an auth session: `user`, `household`, and `tokens`.

## `POST /auth/login`

Authenticates an existing user.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | Valid email; normalized to lowercase |
| `password` | string | 1-128 chars |

### Response

`200 OK` with an auth session.

## `POST /auth/refresh`

Rotates a refresh token and returns a fresh auth session.

### Body

| Field | Type | Rules |
| --- | --- | --- |
| `refreshToken` | string | At least 32 chars |

## `POST /auth/logout`

Invalidates one refresh token.

### Body

Same as refresh.

### Response

`204 No Content`.

## `GET /auth/me`

Requires bearer auth. Returns the current user and household context without tokens.

### Response shape

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "wife@example.com",
      "displayName": "Wife",
      "avatarUrl": null
    },
    "household": {
      "id": "uuid",
      "name": "Household",
      "role": "owner"
    }
  }
}
```
