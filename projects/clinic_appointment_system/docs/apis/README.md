# Clinic Appointment System - API Documentation

## Overview
This documentation covers all API endpoints for the Clinic Appointment System MVP.

**Base URL**: `http://localhost:3000` (development)

**API Version**: v1

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication
- [POST /auth/token](./auth.md#login) - Login/authenticate user
- [DELETE /auth/token](./auth.md#logout) - Logout/invalidate token

### Doctors
- [GET /doctors](./doctors.md#list-doctors) - List all doctors
- [GET /doctors/:id](./doctors.md#get-doctor) - Get specific doctor details
- [GET /doctors/:id/availability](./doctors.md#get-availability) - Check doctor's available time slots
- [PUT /doctors/:id/schedule](./doctors.md#update-schedule) - Update doctor's schedule

### Appointments
- [GET /appointments](./appointments.md#list-appointments) - List appointments
- [POST /appointments](./appointments.md#create-appointment) - Create new appointment
- [DELETE /appointments/:id](./appointments.md#cancel-appointment) - Cancel appointment

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

## Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | User doesn't have permission for this action |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource conflict (e.g., slot already booked) |
| `INTERNAL_ERROR` | 500 | Server error |

## Rate Limiting
- **Default**: 100 requests per minute per IP
- **Authenticated users**: 200 requests per minute

## Idempotency
Write operations (POST, PUT, DELETE) support idempotency keys to allow safe retries:
```
Idempotency-Key: <unique-request-id>
```

## Pagination
List endpoints support pagination via query parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

Example:
```
GET /appointments?page=2&limit=50
```

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```
