# Authentication API

## Overview
Handles user authentication and session management using JWT tokens.

---

## Login

**Endpoint**: `POST /auth/token`

**Description**: Authenticate a user and receive a JWT access token.

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "patient@example.com",
  "password": "string"
}
```

**Request Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "patient@example.com",
      "name": "John Doe",
      "role": "PATIENT"
    }
  }
}
```

**Error Responses**:

*Invalid Credentials* (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  }
}
```

*Validation Error* (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "email": ["must be a valid email address"]
    }
  }
}
```

**Example Usage**:
```bash
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password123"
  }'
```

---

## Logout

**Endpoint**: `DELETE /auth/token`

**Description**: Invalidate the current access token (logout).

**Authentication**: Required (Bearer Token)

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Request Body**: None

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Successfully logged out"
}
```

**Error Responses**:

*Unauthorized* (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**Example Usage**:
```bash
curl -X DELETE http://localhost:3000/auth/token \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Token Refresh (Future Enhancement)

**Note**: In the MVP, tokens have a fixed expiration. Token refresh functionality will be added in future iterations.

---

## Security Notes

1. **HTTPS Only**: In production, all authentication endpoints must use HTTPS
2. **Password Requirements**: Minimum 8 characters, must include uppercase, lowercase, and numbers
3. **Rate Limiting**: Login endpoint is rate-limited to 5 attempts per 15 minutes per IP
4. **Token Storage**: Store tokens securely (HttpOnly cookies or secure storage)
5. **Token Expiration**: Default expiration is 24 hours (86400 seconds)

---

## User Roles

| Role | Description |
|------|-------------|
| `PATIENT` | Regular patient user |
| `DOCTOR` | Medical professional with scheduling capabilities |
| `ADMIN` | System administrator (future use) |

Role-based access control is enforced on protected endpoints.
