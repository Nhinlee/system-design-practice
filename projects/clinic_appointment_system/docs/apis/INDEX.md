# API Documentation Index

## Quick Links

- **[API Overview](./README.md)** - Introduction, authentication, common patterns
- **[OpenAPI Specification](./openapi.yaml)** - Machine-readable API spec (Swagger/OpenAPI 3.0)

## Endpoint Documentation

### Authentication Endpoints
- **[Authentication API](./auth.md)**
  - `POST /auth/token` - Login
  - `DELETE /auth/token` - Logout

### Doctor Endpoints  
- **[Doctors API](./doctors.md)**
  - `GET /doctors` - List all doctors
  - `GET /doctors/:id` - Get doctor details
  - `GET /doctors/:id/availability` - Check availability
  - `PUT /doctors/:id/schedule` - Update schedule

### Appointment Endpoints
- **[Appointments API](./appointments.md)**
  - `GET /appointments` - List appointments
  - `POST /appointments` - Create appointment
  - `DELETE /appointments/:id` - Cancel appointment

## Tools & Testing

### Swagger UI
You can view and test the API interactively using Swagger UI:

1. **Local Development**:
   ```bash
   # If you have Swagger UI installed
   npx swagger-ui-watcher docs/apis/openapi.yaml
   ```

2. **Online Viewer**:
   - Upload `openapi.yaml` to [Swagger Editor](https://editor.swagger.io/)

### Postman Collection
Import the OpenAPI spec into Postman:
1. Open Postman
2. Import > Upload Files
3. Select `docs/apis/openapi.yaml`

### cURL Examples
Each endpoint documentation includes cURL examples. Quick test:

```bash
# Login
curl -X POST http://localhost:3000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# List doctors (requires token from login)
curl -X GET http://localhost:3000/doctors \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Key Concepts

### Authentication
- **Type**: JWT (JSON Web Tokens)
- **Header**: `Authorization: Bearer <token>`
- **Expiration**: 24 hours (configurable)
- **Refresh**: Not implemented in MVP (future enhancement)

### Idempotency
Write operations support idempotency keys to allow safe retries:
```bash
curl -X POST http://localhost:3000/appointments \
  -H "Idempotency-Key: unique-key-123" \
  -H "Authorization: Bearer <token>" \
  -d '{"slotId": "..."}'
```

### Pagination
List endpoints use cursor-based pagination:
- `?page=1` - Page number (default: 1)
- `?limit=20` - Items per page (default: 20, max: 100)

### Error Handling
All errors follow a consistent format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": { }
  }
}
```

### Double-Booking Prevention
The system prevents double-booking using:
1. Database-level unique constraint
2. Transaction-based booking logic
3. Optimistic locking for slot updates

### Audit Trail
All appointment state changes are logged:
- Who made the change
- When it was made
- What changed
- Why (if reason provided)

## Development Workflow

### 1. Start the API
```bash
cd src
pnpm start:dev
```

### 2. Test Endpoints
Use the provided cURL examples or import into Postman

### 3. View Documentation
- Markdown docs in `docs/apis/`
- OpenAPI spec at `docs/apis/openapi.yaml`

### 4. Generate Client SDKs
Using the OpenAPI spec, you can generate client libraries:

```bash
# TypeScript/JavaScript
npx @openapitools/openapi-generator-cli generate \
  -i docs/apis/openapi.yaml \
  -g typescript-axios \
  -o ./client-sdk

# Python
openapi-generator-cli generate \
  -i docs/apis/openapi.yaml \
  -g python \
  -o ./client-sdk-python
```

## Versioning

- **Current Version**: v1
- **API Stability**: MVP (breaking changes possible)
- **Deprecation Policy**: Will be established post-MVP

## Support

For questions or issues:
- **Development**: Check the main [README.md](../../README.md)
- **Database**: See [DATABASE_SETUP.md](../../DATABASE_SETUP.md)
- **Quick Start**: See [QUICKSTART.md](../../QUICKSTART.md)

## Updates & Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-10-05 | 1.0.0 | Initial API documentation |

---

**Last Updated**: October 5, 2025
