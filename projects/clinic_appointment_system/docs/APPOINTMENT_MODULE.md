# Appointment Module - Implementation Summary

## ✅ What Was Implemented

### 1. Database Schema Updates
- ✅ Added `notes` field to Appointment model (optional text for appointment notes)
- ✅ Added `idempotencyKey` field for idempotent request handling
- ✅ Migration: `add_appointment_notes_idempotency`

### 2. Appointment Module Structure
```
src/appointments/
├── dto/
│   ├── create-appointment.dto.ts      # DTO for creating appointments
│   ├── list-appointments-query.dto.ts # Query params for listing appointments
│   ├── appointment-response.dto.ts    # Response DTOs
│   └── index.ts                       # Export all DTOs
├── appointments.controller.ts         # API endpoints
├── appointments.service.ts            # Business logic
└── appointments.module.ts             # Module definition
```

### 3. Implemented Endpoints

| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| POST | `/appointments` | Book new appointment | ✅ Implemented |
| GET | `/appointments` | List appointments (role-based) | ✅ Implemented |
| GET | `/appointments/:id` | Get appointment details | ✅ Implemented |
| DELETE | `/appointments/:id` | Cancel appointment | ✅ Implemented |

---

## 🎯 Key Features

### 1. Double-Booking Prevention
```typescript
// Check if slot is already booked
if (slot.appointments.length > 0) {
  throw new ConflictException(
    'This time slot is already booked. Please select another time.',
  );
}
```

**Database Constraint**:
```prisma
@@unique([slotId, status], name: "unique_booked_slot")
```
- Only one BOOKED appointment per slot at database level
- Prevents race conditions

### 2. Idempotency Support
```typescript
// If idempotency key provided, check for existing appointment
if (idempotencyKey) {
  const existing = await this.prisma.appointment.findFirst({
    where: { idempotencyKey, status: AppointmentStatus.BOOKED },
  });
  
  if (existing) {
    return existing; // Return same appointment
  }
}
```

**How to use**:
```bash
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-request-id-123" \
  -d '{"slotId": "...", "patientId": "..."}'
```

- Calling same request with same key returns same appointment
- Prevents duplicate bookings on network retries

### 3. Role-Based Filtering
```typescript
// Patients: See only their own appointments
if (currentUserRole === UserRole.PATIENT) {
  where.patientId = currentUserId;
}

// Doctors: See appointments scheduled with them
if (currentUserRole === UserRole.DOCTOR) {
  where.slot = { doctorId: currentUserId };
}

// Admins: See all appointments
```

### 4. Business Rule Validations
- ✅ Cannot book appointments in the past
- ✅ Cannot book deleted time slots
- ✅ Cannot book already booked slots
- ✅ Cannot cancel completed appointments
- ✅ Cannot cancel appointments in the past
- ✅ Patient validation (must exist and have PATIENT role)

### 5. Authorization Checks
**View Appointment**:
- Patient can view their own appointments
- Doctor can view appointments with them
- Admin can view all

**Cancel Appointment**:
- Patient can cancel their own
- Doctor can cancel appointments with them
- Admin can cancel any

---

## 📊 API Documentation

### POST /appointments

**Create a new appointment**

**Request Headers**:
```
Idempotency-Key: optional-unique-key
```

**Request Body**:
```json
{
  "slotId": "880e8400-e29b-41d4-a716-446655440000",
  "patientId": "770e8400-e29b-41d4-a716-446655440001",
  "notes": "Regular checkup - experiencing chest pain"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "dd0e8400-e29b-41d4-a716-446655440000",
    "status": "BOOKED",
    "notes": "Regular checkup - experiencing chest pain",
    "slot": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "startTime": "2025-10-15T10:00:00.000Z",
      "endTime": "2025-10-15T10:30:00.000Z"
    },
    "doctor": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Dr. Sarah Johnson",
      "specialty": "Cardiology"
    },
    "patient": {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe"
    },
    "bookedBy": {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe"
    },
    "createdAt": "2025-10-05T14:30:00.000Z",
    "updatedAt": "2025-10-05T14:30:00.000Z"
  },
  "message": "Appointment booked successfully"
}
```

**Error Responses**:

**404 Not Found** - Time slot not found:
```json
{
  "statusCode": 404,
  "message": "Time slot not found",
  "error": "Not Found"
}
```

**409 Conflict** - Slot already booked:
```json
{
  "statusCode": 409,
  "message": "This time slot is already booked. Please select another time.",
  "error": "Conflict"
}
```

**400 Bad Request** - Past appointment:
```json
{
  "statusCode": 400,
  "message": "Cannot book appointments in the past",
  "error": "Bad Request"
}
```

---

### GET /appointments

**List appointments with filtering**

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by status (BOOKED, CANCELLED, COMPLETED)
- `startDate` (optional): Filter from this date (ISO 8601)
- `endDate` (optional): Filter until this date (ISO 8601)
- `doctorId` (optional): Filter by doctor (patients only)
- `patientId` (optional): Filter by patient (doctors/admins only)

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440000",
      "status": "BOOKED",
      "notes": "Regular checkup",
      "slot": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "startTime": "2025-10-15T10:00:00.000Z",
        "endTime": "2025-10-15T10:30:00.000Z"
      },
      "doctor": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Dr. Sarah Johnson",
        "specialty": "Cardiology"
      },
      "patient": {
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "name": "John Doe"
      },
      "bookedBy": {
        "id": "770e8400-e29b-41d4-a716-446655440001",
        "name": "John Doe"
      },
      "createdAt": "2025-10-05T14:30:00.000Z",
      "updatedAt": "2025-10-05T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### GET /appointments/:id

**Get specific appointment details**

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "dd0e8400-e29b-41d4-a716-446655440000",
    "status": "BOOKED",
    "notes": "Regular checkup",
    "slot": {...},
    "doctor": {...},
    "patient": {...},
    "bookedBy": {...},
    "createdAt": "2025-10-05T14:30:00.000Z",
    "updatedAt": "2025-10-05T14:30:00.000Z"
  }
}
```

**Error Responses**:

**404 Not Found**:
```json
{
  "statusCode": 404,
  "message": "Appointment not found",
  "error": "Not Found"
}
```

**403 Forbidden**:
```json
{
  "statusCode": 403,
  "message": "You do not have permission to view this appointment",
  "error": "Forbidden"
}
```

---

### DELETE /appointments/:id

**Cancel an appointment**

**Success Response** (200 OK):
```json
{
  "success": true,
  "message": "Appointment cancelled successfully",
  "data": {
    "id": "dd0e8400-e29b-41d4-a716-446655440000",
    "status": "CANCELLED",
    "cancelledAt": "2025-10-05T15:00:00.000Z"
  }
}
```

**Error Responses**:

**400 Bad Request** - Already cancelled:
```json
{
  "statusCode": 400,
  "message": "Appointment is already cancelled",
  "error": "Bad Request"
}
```

**400 Bad Request** - Completed appointment:
```json
{
  "statusCode": 400,
  "message": "Cannot cancel a completed appointment",
  "error": "Bad Request"
}
```

**403 Forbidden**:
```json
{
  "statusCode": 403,
  "message": "You do not have permission to cancel this appointment",
  "error": "Forbidden"
}
```

---

## 🧪 Testing Guide

### Prerequisites

1. **Start Application**:
```bash
cd src
pnpm run start:dev
```

2. **Create Test Data**:
```sql
-- Connect to database
docker exec -it clinic_postgres psql -U postgres -d clinic_appointment_system

-- Create a patient
INSERT INTO users (id, email, name, role, created_at, updated_at)
VALUES ('patient-uuid-1', 'john.doe@example.com', 'John Doe', 'PATIENT', now(), now());

INSERT INTO patient_profiles (id, user_id, date_of_birth, phone_number, created_at, updated_at)
VALUES ('patient-profile-1', 'patient-uuid-1', '1990-05-15', '+1234567890', now(), now());

-- Use existing doctor (doctor-uuid-1) and their time slots
\q
```

### Test Cases

#### 1. Book an Appointment
```bash
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "d8edc331-275a-42bd-9a6f-f2e395426a1c",
    "patientId": "patient-uuid-1",
    "notes": "Regular checkup"
  }'
```

**Expected**: 200 OK with appointment details

#### 2. Test Idempotency
```bash
# Same request with idempotency key
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-123" \
  -d '{
    "slotId": "e6361233-9d38-4f2d-bd1d-b50c659c566e",
    "patientId": "patient-uuid-1"
  }'

# Run again with same key
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-key-123" \
  -d '{
    "slotId": "e6361233-9d38-4f2d-bd1d-b50c659c566e",
    "patientId": "patient-uuid-1"
  }'
```

**Expected**: Second request returns same appointment (not a new one)

#### 3. Test Double-Booking Prevention
```bash
# Try to book already booked slot
curl -X POST http://localhost:3000/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "slotId": "d8edc331-275a-42bd-9a6f-f2e395426a1c",
    "patientId": "patient-uuid-1"
  }'
```

**Expected**: 409 Conflict - "This time slot is already booked"

#### 4. List All Appointments
```bash
curl http://localhost:3000/appointments
```

**Expected**: 200 OK with list of appointments

#### 5. List with Filters
```bash
# Filter by status
curl "http://localhost:3000/appointments?status=BOOKED"

# Filter by date range
curl "http://localhost:3000/appointments?startDate=2025-10-15T00:00:00Z&endDate=2025-10-15T23:59:59Z"

# Pagination
curl "http://localhost:3000/appointments?page=1&limit=10"
```

#### 6. Get Specific Appointment
```bash
curl http://localhost:3000/appointments/{APPOINTMENT_ID}
```

#### 7. Cancel Appointment
```bash
curl -X DELETE http://localhost:3000/appointments/{APPOINTMENT_ID}
```

**Expected**: 200 OK - Appointment cancelled

#### 8. Try to Cancel Again
```bash
curl -X DELETE http://localhost:3000/appointments/{APPOINTMENT_ID}
```

**Expected**: 400 Bad Request - "Appointment is already cancelled"

---

## 🔒 Current Limitations (Authentication TODO)

Currently, all endpoints use temporary admin credentials:
```typescript
// TODO: Get from JWT token
const currentUserId = 'temp-admin-id';
const currentUserRole = UserRole.ADMIN;
```

**Next steps**:
1. Implement Auth module with JWT
2. Create authentication guards
3. Extract user ID and role from JWT token
4. Apply guards to all endpoints

---

## 🎉 Success Criteria

- [x] Create appointment with validation
- [x] Double-booking prevention (database + application level)
- [x] Idempotency support
- [x] Role-based appointment listing
- [x] Authorization checks for view/cancel
- [x] Status validation (can't cancel completed/past appointments)
- [x] DTOs with proper validation
- [x] Comprehensive error handling
- [x] Module registered in AppModule

---

## 📝 Next Steps

1. **Implement Authentication Module**
   - JWT token generation/validation
   - Auth guards for protected endpoints
   - Extract user context from tokens

2. **Add Tests**
   - Unit tests for service methods
   - Integration tests for endpoints
   - Test edge cases

3. **Implement Audit Trail**
   - Log all appointment state changes
   - Track who made changes and when

4. **Add Notifications**
   - Email confirmation on booking
   - Reminder before appointment
   - Cancellation notification

5. **Optimize Queries**
   - Add indexes for common queries
   - Implement caching where appropriate

---

**Application Status**: ✅ Fully implemented, ready for testing

**Endpoints**: 4/4 implemented  
**Validation**: ✅ Complete  
**Error Handling**: ✅ Complete  
**Documentation**: ✅ Complete  
