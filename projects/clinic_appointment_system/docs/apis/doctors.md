# Doctors API

## Overview
Endpoints for managing doctor information and availability.

---

## List Doctors

**Endpoint**: `GET /doctors`

**Description**: Retrieve a paginated list of all doctors with their basic information.

**Authentication**: Required

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | integer | No | 1 | Page number |
| limit | integer | No | 20 | Items per page (max: 100) |
| specialty | string | No | - | Filter by specialty |
| search | string | No | - | Search by name or specialty |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Dr. Sarah Johnson",
      "email": "sarah.johnson@clinic.com",
      "profile": {
        "specialty": "Cardiology",
        "shortDescription": "Experienced cardiologist with 15 years of practice"
      }
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "name": "Dr. Michael Chen",
      "email": "michael.chen@clinic.com",
      "profile": {
        "specialty": "Pediatrics",
        "shortDescription": "Board-certified pediatrician specializing in child development"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Example Usage**:
```bash
# List all doctors
curl -X GET http://localhost:3000/doctors \
  -H "Authorization: Bearer <token>"

# Filter by specialty
curl -X GET "http://localhost:3000/doctors?specialty=Cardiology" \
  -H "Authorization: Bearer <token>"

# Search with pagination
curl -X GET "http://localhost:3000/doctors?search=Johnson&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

---

## Get Doctor

**Endpoint**: `GET /doctors/:id`

**Description**: Retrieve detailed information about a specific doctor.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Doctor's user ID |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Dr. Sarah Johnson",
    "email": "sarah.johnson@clinic.com",
    "role": "DOCTOR",
    "address": "123 Medical Plaza, Suite 400",
    "profile": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "specialty": "Cardiology",
      "shortDescription": "Experienced cardiologist with 15 years of practice",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-09-20T14:30:00Z"
  }
}
```

**Error Responses**:

*Not Found* (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Doctor not found"
  }
}
```

**Example Usage**:
```bash
curl -X GET http://localhost:3000/doctors/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <token>"
```

---

## Get Doctor Availability

**Endpoint**: `GET /doctors/:id/availability`

**Description**: Check a doctor's available time slots within a date range.

**Authentication**: Required

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Doctor's user ID |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | string (ISO 8601) | Yes | Start date for availability check |
| end_date | string (ISO 8601) | Yes | End date for availability check |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "doctorId": "550e8400-e29b-41d4-a716-446655440000",
    "doctorName": "Dr. Sarah Johnson",
    "dateRange": {
      "startDate": "2025-10-10T00:00:00Z",
      "endDate": "2025-10-15T23:59:59Z"
    },
    "availableSlots": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "startTime": "2025-10-10T09:00:00Z",
        "endTime": "2025-10-10T09:30:00Z",
        "isBooked": false
      },
      {
        "id": "990e8400-e29b-41d4-a716-446655440001",
        "startTime": "2025-10-10T09:30:00Z",
        "endTime": "2025-10-10T10:00:00Z",
        "isBooked": false
      },
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440002",
        "startTime": "2025-10-10T10:00:00Z",
        "endTime": "2025-10-10T10:30:00Z",
        "isBooked": true
      }
    ],
    "summary": {
      "totalSlots": 48,
      "availableSlots": 35,
      "bookedSlots": 13
    }
  }
}
```

**Error Responses**:

*Validation Error* (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid date range",
    "details": {
      "start_date": ["must be a valid ISO 8601 date"],
      "end_date": ["must be after start_date"]
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
    "message": "Doctor not found"
  }
}
```

**Business Rules**:
- Date range cannot exceed 30 days
- Only returns slots that are not soft-deleted (`deletedAt` is null)
- Slots marked as booked have an active appointment with status `BOOKED`

**Example Usage**:
```bash
curl -X GET "http://localhost:3000/doctors/550e8400-e29b-41d4-a716-446655440000/availability?start_date=2025-10-10T00:00:00Z&end_date=2025-10-15T23:59:59Z" \
  -H "Authorization: Bearer <token>"
```

---

## Update Doctor Schedule

**Endpoint**: `PUT /doctors/:id/schedule`

**Description**: Create or update a doctor's availability schedule. Only the doctor themselves or an admin can update their schedule.

**Authentication**: Required (Doctor role)

**Authorization**: User must be the doctor being updated or have admin role

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string (UUID) | Doctor's user ID |

**Request Body**:
```json
{
  "timeSlots": [
    {
      "startTime": "2025-10-10T09:00:00Z",
      "endTime": "2025-10-10T09:30:00Z"
    },
    {
      "startTime": "2025-10-10T09:30:00Z",
      "endTime": "2025-10-10T10:00:00Z"
    },
    {
      "startTime": "2025-10-10T10:00:00Z",
      "endTime": "2025-10-10T10:30:00Z"
    }
  ]
}
```

**Request Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timeSlots | array | Yes | Array of time slot objects |
| timeSlots[].startTime | string (ISO 8601) | Yes | Slot start time |
| timeSlots[].endTime | string (ISO 8601) | Yes | Slot end time |

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "created": 45,
    "updated": 0,
    "deleted": 3,
    "timeSlots": [
      {
        "id": "bb0e8400-e29b-41d4-a716-446655440000",
        "startTime": "2025-10-10T09:00:00Z",
        "endTime": "2025-10-10T09:30:00Z",
        "doctorId": "550e8400-e29b-41d4-a716-446655440000"
      }
      // ... more slots
    ]
  },
  "message": "Schedule updated successfully"
}
```

**Error Responses**:

*Forbidden* (403 Forbidden):
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only update your own schedule"
  }
}
```

*Validation Error* (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid time slot data",
    "details": {
      "timeSlots[0].endTime": ["must be after startTime"],
      "timeSlots[2].startTime": ["overlaps with existing slot"]
    }
  }
}
```

*Conflict* (409 Conflict):
```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Cannot delete slot with active appointment",
    "details": {
      "slotId": "880e8400-e29b-41d4-a716-446655440000",
      "appointmentId": "cc0e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**Business Rules**:
- Each slot must be at least 15 minutes long
- Slots cannot overlap with each other
- Cannot delete or modify slots with active (BOOKED) appointments
- Slots with cancelled/completed appointments can be deleted (soft delete)
- Slot duration is typically 30 minutes (configurable)

**Example Usage**:
```bash
curl -X PUT http://localhost:3000/doctors/550e8400-e29b-41d4-a716-446655440000/schedule \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "timeSlots": [
      {
        "startTime": "2025-10-10T09:00:00Z",
        "endTime": "2025-10-10T09:30:00Z"
      }
    ]
  }'
```

---

## Notes

### Timezone Handling
- All timestamps are stored and returned in UTC (ISO 8601 format)
- Client applications should convert to local timezone for display
- Example: `2025-10-10T09:00:00Z` (9:00 AM UTC)

### Soft Delete
- Time slots are soft-deleted (using `deletedAt` field) rather than permanently removed
- This preserves historical data for audit purposes
- Deleted slots are excluded from availability queries

### Specialties
Common specialties include:
- Cardiology
- Pediatrics
- Dermatology
- Orthopedics
- Neurology
- General Practice
- And more...
