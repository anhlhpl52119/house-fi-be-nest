# Authentication

The API uses email/password authentication, short-lived JWT access tokens, and persisted rotating refresh tokens.

## Registration and login

`POST /auth/register` creates the first user, their default household, owner membership, and an authenticated session.

`POST /auth/login` returns a new authenticated session for an existing user.

Session responses include:

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
      "name": "Wife's household",
      "role": "owner"
    },
    "tokens": {
      "accessToken": "jwt",
      "refreshToken": "opaque-token",
      "tokenType": "Bearer"
    }
  }
}
```

## Bearer token use

Authenticated endpoints require:

```http
Authorization: Bearer <accessToken>
```

The access token identifies the user. Services derive the current household from the user's active household membership rather than accepting a household id in request input.

## Refresh and logout

- `POST /auth/refresh` rotates a refresh token and returns a fresh session.
- `POST /auth/logout` invalidates one refresh token and returns `204 No Content`.

## Current identity

`GET /auth/me` returns the current user and household context. Use it after app startup to restore authenticated UI state.
