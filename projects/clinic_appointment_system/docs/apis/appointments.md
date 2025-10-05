# Appointments API

## Overview
Endpoints for managing patient appointments with doctors.

---

## List Appointments

**Endpoint**: `GET /appointments`

**Description**: Retrieve a list of appointments. Results are automatically filtered based on user role:
- **Patients**: See only their own appointments
- **Doctors**: See appointments scheduled with them
- **Admins**: See all appointments

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |
| limit | integer | No | 20 | Items per page (max: 100) |
| status | string | No | - | Filter by status: `BOOKED`, `CANCELLED`, `COMPLETED` |
| startDate | string (ISO 8601) | No | - | Filter appointments from this date |
| endDate | string (ISO 8601) | No | - | Filter appointments until this date |
| doctorId | string (UUID) | No | - | Filter by specific doctor (patients only) |
| patientId | string (UUID) | No | - | Filter by specific patient (doctors/admins only) |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "dd0e8400-e29b-41d4-a716-446655440000",
      "status": "BOOKED",
      "slot": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "startTime": "2025-10-15T10:00:00Z",
        "endTime": "2025-10-15T10:30:00Z"
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
      "createdAt": "2025-10-01T09:30:00Z",
      "updatedAt": "2025-10-01T09:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Example Usage**:
```bash
# List all my appointments
curl -X GET http://localhost:3000/appointments \
  -H "Authorization: Bearer <token>"

# Filter by status and date range
curl -X GET "http://localhost:3000/appointments?status=BOOKED&startDate=2025-10-10T00:00:00Z&endDate=2025-10-20T23:59:59Z" \
  -H "Authorization: Bearer <token>"

# Patient viewing appointments with specific doctor
curl -X GET "http://localhost:3000/appointments?doctorId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer <token>"
```

---

## Create Appointment

**Endpoint**: `POST /appointments`

**Description**: Book a new appointment by selecting an available time slot. This operation is idempotent - retrying with the same idempotency key will return the existing appointment.

**Authentication**: Required

**Request Headers**:
```
Authorization: Bearer <token>
Idempotency-Key: <unique-request-id>  (optional but recommended)
```

**Request Body**:
```json
{
  "slotId": "880e8400-e29b-41d4-a716-446655440000",
  "patientId": "770e8400-e29b-41d4-a716-446655440001",
  "notes": "Patient experiencing chest pain"
}
```

**Request Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| slotId | string (UUID) | Yes | ID of the time slot to book |
| patientId | string (UUID) | No | Patient user ID (defaults to current user if not provided) |
| notes | string | No | Additional notes for the appointment |

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "ee0e8400-e29b-41d4-a716-446655440000",
    "slotId": "880e8400-e29b-41d4-a716-446655440000",
    "status": "BOOKED",
    "slot": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "startTime": "2025-10-15T10:00:00Z",
      "endTime": "2025-10-15T10:30:00Z",
      "doctor": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Dr. Sarah Johnson",
        "specialty": "Cardiology"
      }
    },
    "patient": {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe",
      "email": "john.doe@example.com"
    },
    "bookedBy": {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe"
    },
    "createdAt": "2025-10-05T14:30:00Z",
    "updatedAt": "2025-10-05T14:30:00Z"
  },
  "message": "Appointment booked successfully. Confirmation email sent."
}
```

**Error Responses**:

*Conflict - Slot Already Booked* (409 Conflict):
```json
{
  "success": false,
  "error": {
    "code": "SLOT_ALREADY_BOOKED",
    "message": "This time slot is no longer available",
    "details": {
      "slotId": "880e8400-e29b-41d4-a716-446655440000",
      "slotTime": "2025-10-15T10:00:00Z"
    }
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
      "slotId": ["must be a valid UUID"],
      "patientId": ["patient does not exist"]
    }
  }
}
```

*Not Found* (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Time slot not found or has been deleted"
  }
}
```

*Forbidden* (403 Forbidden):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only book appointments for yourself or your dependents"
  }
}
```

**Business Rules**:
1. **Double-booking prevention**: Enforced at database level with unique constraint on `(slotId, status)` where `status = 'BOOKED'`
2. **Idempotency**: Using the same `Idempotency-Key` within 24 hours will return the existing appointment (if already created)
3. **Patient authorization**: Users can only book for themselves unless they have dependent relationships
4. **Slot validation**: Slot must exist, not be deleted, and not be in the past
5. **Automatic notifications**: Confirmation emails are sent to both patient and doctor
6. **Audit trail**: Appointment creation is automatically logged in `audit_appointments` table

**Example Usage**:
```bash
curl -X POST http://localhost:3000/appointments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: booking-$(uuidgen)" \
  -d '{
    "slotId": "880e8400-e29b-41d4-a716-446655440000"
  }'
```

**Idempotency Example**:
```bash
# First request - creates appointment
curl -X POST http://localhost:3000/appointments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: my-unique-key-123" \
  -d '{"slotId": "880e8400-e29b-41d4-a716-446655440000"}'

# Retry with same key - returns existing appointment (safe retry)
curl -X POST http://localhost:3000/appointments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: my-unique-key-123" \
  -d '{"slotId": "880e8400-e29b-41d4-a716-446655440000"}'
```

---

## Cancel Appointment

**Endpoint**: `DELETE /appointments/:id`

**Description**: Cancel an existing appointment. Both the patient and the doctor can cancel an appointment. This operation is idempotent.

**Authentication**: Required

**Authorization**: User must be either the patient or the doctor of the appointment

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Appointment ID |

**Request Headers**:
```
Authorization: Bearer <token>
Idempotency-Key: <unique-request-id>  (optional but recommended)
```

**Request Body**:
```json
{
  "reason": "Patient requested to reschedule",
  "notifyParties": true
}
```

**Request Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | No | Reason for cancellation |
| notifyParties | boolean | No | Send notification emails (default: true) |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "ee0e8400-e29b-41d4-a716-446655440000",
    "status": "CANCELLED",
    "slot": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "startTime": "2025-10-15T10:00:00Z",
      "endTime": "2025-10-15T10:30:00Z"
    },
    "patient": {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe"
    },
    "doctor": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Dr. Sarah Johnson"
    },
    "cancelledAt": "2025-10-05T15:45:00Z",
    "cancelledBy": {
      "id": "770e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe",
      "role": "PATIENT"
    }
  },
  "message": "Appointment cancelled successfully. Notification sent to all parties."
}
```

**Error Responses**:

*Not Found* (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Appointment not found"
  }
}
```

*Forbidden* (403 Forbidden):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to cancel this appointment"
  }
}
```

*Conflict* (409 Conflict):
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_CANCELLED",
    "message": "This appointment has already been cancelled",
    "details": {
      "cancelledAt": "2025-10-05T15:45:00Z",
      "cancelledBy": "John Doe"
    }
  }
}
```

*Bad Request* (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "APPOINTMENT_IN_PAST",
    "message": "Cannot cancel appointments that have already occurred",
    "details": {
      "appointmentTime": "2025-09-15T10:00:00Z"
    }
  }
}
```

**Business Rules**:
1. **Authorization**: Only the patient or the doctor involved can cancel
2. **Status transition**: `BOOKED` → `CANCELLED` only
3. **Already cancelled**: Attempting to cancel an already cancelled appointment is idempotent (returns success)
4. **Past appointments**: Cannot cancel appointments that have already occurred
5. **Automatic notifications**: Cancellation emails sent to patient and doctor (unless `notifyParties: false`)
6. **Audit trail**: Cancellation is logged with user who performed the action
7. **Slot release**: Once cancelled, the slot becomes available for booking again

**Example Usage**:
```bash
# Cancel appointment
curl -X DELETE http://localhost:3000/appointments/ee0e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Patient needs to reschedule",
    "notifyParties": true
  }'

# Cancel without sending notifications
curl -X DELETE http://localhost:3000/appointments/ee0e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Duplicate booking",
    "notifyParties": false
  }'
```

---

## Appointment Status Flow

```
┌─────────┐
│ BOOKED  │ ──────────────┐
└─────────┘               │
     │                    │
     │ (time passes)      │ (DELETE /appointments/:id)
     ↓                    ↓
┌───────────┐       ┌────────────┐
│ COMPLETED │       │ CANCELLED  │
└───────────┘       └────────────┘
```

**Status Descriptions**:
- `BOOKED`: Active appointment, slot is reserved
- `CANCELLED`: Appointment was cancelled by patient or doctor
- `COMPLETED`: Appointment occurred (automatically updated after end time, or manually by doctor)

---

## Notification Timeline

When an appointment is created or cancelled, the following notifications are triggered:

**On Creation**:
1. **Immediate**: Confirmation email to patient
2. **Immediate**: Notification to doctor
3. **24 hours before**: Reminder email to patient (delayed message in queue)
4. **1 hour before**: Reminder SMS/email to patient (delayed message in queue)

**On Cancellation**:
1. **Immediate**: Cancellation notification to patient (if cancelled by doctor)
2. **Immediate**: Cancellation notification to doctor (if cancelled by patient)

---

## Audit Trail

All appointment state changes are automatically logged in the `audit_appointments` table with:
- Previous and new status
- User who performed the action
- Timestamp of the change
- Action type (CREATED, CANCELLED, COMPLETED, etc.)

This audit trail cannot be deleted and is used for:
- Compliance and regulatory requirements
- Troubleshooting and debugging
- User activity tracking
- Analytics and reporting

---

## Notes

### Cancellation Policy
- Default cancellation policy: Appointments can be cancelled up to 1 hour before scheduled time
- Late cancellations (< 1 hour before) may require admin approval (future enhancement)
- No-show appointments are marked as `COMPLETED` with a flag (future enhancement)

### Overbooking Protection
The system uses a database-level unique constraint to prevent double-booking:
```sql
CREATE UNIQUE INDEX idx_unique_booked_slot 
ON appointments (slot_id, status) 
WHERE status = 'BOOKED';
```

This ensures that only one `BOOKED` appointment can exist for any given slot, even under race conditions.

### Time Slot Reuse
- When an appointment is cancelled, the slot becomes immediately available
- The same slot can be booked multiple times over its lifetime (as long as only one `BOOKED` appointment exists at a time)
- Historical appointments (cancelled/completed) remain in the database for audit purposes
