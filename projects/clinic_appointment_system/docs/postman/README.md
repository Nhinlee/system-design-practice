# Postman Collections

This directory contains Postman collections for testing the Clinic Appointment System APIs.

## Available Collections

### 1. Doctors API Collection
**File**: `doctors-api.postman_collection.json`

#### Endpoints Included:
- `GET /doctors` - List all doctors with pagination and filtering
- `GET /doctors/:id` - Get doctor details
- `GET /doctors/:id/availability` - Check doctor's available time slots
- `PUT /doctors/:id/schedule` - Update doctor's schedule

#### Features:
✅ Environment variables for easy configuration  
✅ Multiple response examples (success, errors, edge cases)  
✅ Comprehensive documentation for each endpoint  
✅ Pre-configured query parameters  
✅ Request body templates  
✅ Error scenario examples  

---

## How to Import

### Method 1: Using Postman Desktop App
1. Open Postman
2. Click "Import" button (top left)
3. Click "Choose Files"
4. Navigate to this directory and select `doctors-api.postman_collection.json`
5. Click "Import"

### Method 2: Drag and Drop
1. Open Postman
2. Drag the `.json` file into the Postman window
3. Collection will be imported automatically

### Method 3: Import from URL (if hosted)
1. Open Postman
2. Click "Import" → "Link"
3. Paste the URL to the collection file
4. Click "Continue"

---

## Configuration

After importing, configure the environment variables:

### Variables

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:3000` | API server base URL |
| `doctorId` | `doctor-uuid-1` | Sample doctor ID for testing |

### How to Update Variables

#### Method 1: Collection Variables
1. Click on the collection name
2. Go to "Variables" tab
3. Update the "Current Value" column
4. Click "Save"

#### Method 2: Environment
1. Create a new environment (click "Environments" in sidebar)
2. Add the same variables
3. Set values for different environments (local, dev, staging)
4. Select the environment from dropdown (top right)

---

## Quick Start

### 1. Start the Application
```bash
cd src
pnpm run start:dev
```

Application should be running on `http://localhost:3000`

### 2. Create Test Data
```bash
# Connect to database
docker exec -it clinic_postgres psql -U postgres -d clinic_appointment_system

# Insert test doctor
INSERT INTO users (id, email, name, role, address, created_at, updated_at)
VALUES ('doctor-uuid-1', 'dr.johnson@clinic.com', 'Dr. Sarah Johnson', 'DOCTOR', 
        '123 Medical Plaza', now(), now());

INSERT INTO doctor_profiles (id, user_id, specialty, short_description, created_at, updated_at)
VALUES ('profile-uuid-1', 'doctor-uuid-1', 'Cardiology', 
        'Experienced cardiologist', now(), now());

# Exit
\q
```

### 3. Test in Postman
1. Open the "Doctors" folder
2. Click on "List All Doctors"
3. Click "Send"
4. You should see Dr. Johnson in the response

---

## Example Requests

### List Doctors with Filtering
```
GET http://localhost:3000/doctors?specialty=Cardiology&page=1&limit=10
```

### Get Doctor Availability
```
GET http://localhost:3000/doctors/doctor-uuid-1/availability?start_date=2025-10-15T00:00:00Z&end_date=2025-10-15T23:59:59Z
```

### Update Doctor Schedule
```
PUT http://localhost:3000/doctors/doctor-uuid-1/schedule
Content-Type: application/json

{
  "timeSlots": [
    {
      "startTime": "2025-10-15T09:00:00Z",
      "endTime": "2025-10-15T09:30:00Z"
    },
    {
      "startTime": "2025-10-15T09:30:00Z",
      "endTime": "2025-10-15T10:00:00Z"
    }
  ]
}
```

---

## Response Examples

Each endpoint includes multiple response examples:

### Success Cases
- ✅ Empty list (no data)
- ✅ With data
- ✅ Idempotent operations

### Error Cases
- ❌ 400 Bad Request (validation errors)
- ❌ 403 Forbidden (authorization errors)
- ❌ 404 Not Found (resource not found)
- ❌ 409 Conflict (business rule violations)

---

## Testing Tips

### 1. Test Idempotency
Run the "Update Doctor Schedule" request multiple times with the same data.
- First call: Creates new slots
- Subsequent calls: Keeps existing slots (no duplicates)

### 2. Test Validation
Try invalid data to see error responses:
```json
{
  "timeSlots": [
    {
      "startTime": "2025-10-15T09:00:00Z",
      "endTime": "2025-10-15T08:00:00Z"  // End before start - should fail
    }
  ]
}
```

### 3. Test Edge Cases
- Empty time slots array
- Overlapping slots
- Slots less than 15 minutes
- Date range > 30 days

### 4. Check Response Structure
All responses follow this structure:
```json
{
  "success": true,
  "data": { /* ... */ },
  "pagination": { /* for list endpoints */ },
  "message": "..." // for write operations
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

---

## Collection Structure

```
Doctors API Collection
├── Variables
│   ├── baseUrl
│   └── doctorId
└── Doctors
    ├── List All Doctors
    │   ├── Request
    │   └── Examples
    │       ├── Success - Empty List
    │       └── Success - With Doctors
    ├── Get Doctor by ID
    │   ├── Request
    │   └── Examples
    │       ├── Success
    │       └── Not Found
    ├── Get Doctor Availability
    │   ├── Request
    │   └── Examples
    │       ├── Success
    │       └── Validation Error
    └── Update Doctor Schedule
        ├── Request
        └── Examples
            ├── Success
            ├── Idempotent - No Duplicates
            ├── Validation Error
            ├── Conflict
            └── Forbidden
```

---

## Troubleshooting

### Issue: Connection Refused
**Solution**: Make sure the application is running
```bash
cd src && pnpm run start:dev
```

### Issue: 404 Not Found
**Solution**: Check the `doctorId` variable matches a real doctor in database

### Issue: Doctor not found
**Solution**: Create test data using the SQL commands above

### Issue: Variables not working
**Solution**: 
1. Click collection name → Variables tab
2. Make sure "Current Value" is set (not just "Initial Value")
3. Click "Save"

---

## Related Documentation

- **API Documentation**: `../apis/doctors.md`
- **OpenAPI Spec**: `../apis/openapi.yaml`
- **Implementation Guide**: `../DOCTOR_MODULE.md`
- **Duplicate Fix**: `../FIX_DUPLICATE_SLOTS.md`
- **Quick Start**: `../../QUICKSTART.md`

---

## Future Collections

Additional collections to be added:
- 🔜 Authentication API
- 🔜 Appointments API
- 🔜 Patients API
- 🔜 Notifications API

---

**Status**: ✅ Doctors API collection ready to use!

For questions or issues, refer to the main project documentation.
