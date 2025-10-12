### System Design Problem: Clinic Appointment System (CAS)

> **Status**: ✅ Core modules implemented and tested | ⚠️ Authentication pending  
> **Last Updated**: October 6, 2025

## Quick Links
- 📊 [High-Level Architecture](./diagrams/high_level/)
- 🗄️ [Database ERD](./diagrams/erd/)
- 📖 [API Documentation](./docs/apis/)
- 🧪 [Testing Strategy](./docs/TESTING.md)
- 🚀 [Production Readiness](./docs/PRODUCTION_READINESS.md)
- 📮 [Postman Collections](./docs/postman/)
- 🛠️ [CLI & Makefile Guide](./docs/CLI_MAKEFILE_GUIDE.md)
- ⚡ [Quick Reference](./QUICK_REFERENCE.md)

# Quick Start

```bash
# First time setup
make quickstart

# Start development
make dev

# Check system health
./cli.js health

# Run quick validation (30s)
make test-smoke

# View HTML report
make report-smoke
```

📖 **See [Quick Reference](./QUICK_REFERENCE.md) for common commands**  
📖 **See [k6 Load Testing Guide](./K6_QUICK_REFERENCE.md) for load testing**

---

**1. Overview**

* **System**: Clinic Appointment System
* **Core Function**: Build a service for patients to see a doctor's real-time availability and book, reschedule, or cancel appointments for a single clinic facility.
* **Implementation Status**:
  - ✅ Doctor Management (4 endpoints)
  - ✅ Appointment Booking (4 endpoints)
  - ✅ Database Schema (7 entities)
  - ✅ Test Infrastructure (Unit + E2E + Load tests)
  - ⚠️ Authentication (Temporary, JWT pending)

**2. Requirements (MVP CORE ONLY)**

* **User Roles & Core Features**:
    * For the **Patient**:
        * ~~Authenticate via email/OTP.~~ (Pending - Using temp credentials)
        * ✅ View a list of doctors and their available time slots.
        * ✅ Book an appointment for an available time slot.
        * ✅ View and cancel their own upcoming appointments.
        * Receive email notifications for appointment confirmation and reminders. (Planned)
    * For the **Doctor/Clinic Staff**:
        * ✅ Define their weekly availability (e.g., Mon 9 AM - 5 PM, Tue 10 AM - 6 PM).
        * ✅ View a calendar of their upcoming appointments.
        * ✅ Cancel an appointment (which should notify the patient).

* **System Behavior**:
    * **Critical Requirement #1**: ✅ The system must prevent double-booking of any time slot.
      - *Implementation*: Unique constraint at database level + application validation
      - *Tested*: E2E tests verify concurrent booking prevention
    * **Critical Requirement #2**: ✅ Key actions (booking, canceling) must be idempotent to allow for safe client-side retries.
      - *Implementation*: Idempotency-Key header support with database tracking
      - *Tested*: Unit tests + E2E tests verify duplicate request handling
    * **Critical Requirement #3**: ⚠️ A basic audit trail must be kept for all appointment state changes (e.g., `booked`, `cancelled`).
      - *Implementation*: Schema defined, not yet integrated into endpoints

**3. Explicit Non-Goals for MVP**

* Payments, billing, or insurance processing.
* Integration with external Electronic Medical Record (EMR) systems.
* Telehealth features (video/chat).
* Appointment waitlists.
* Complex, role-based access control (RBAC).
* Support for multiple clinic sites or data synchronization between facilities.

**4. Scale & Constraints**

* **Size**: A single medium-sized clinic with ~50 doctors and ~20,000 active patients (MAU).
* **Traffic Pattern**: Primarily during business hours (8 AM - 6 PM). We can estimate an average of 10 requests per second (RPS), with peaks of up to 50 RPS. Write operations (booking/canceling) will constitute about 10% of the total traffic.
* **SLAs (Service Level Agreements)**:
    * **Latency**: p95 read latency (viewing slots) ≤ 200 ms; p95 write latency (booking) ≤ 500 ms.
    * **Availability**: 99.9% (approx. 43 minutes of downtime per month is acceptable).
* **Data Sensitivity & Retention**:
    * **Sensitivity**: Data contains Personally Identifiable Information (PII). All data must be encrypted in transit (TLS) and at rest.
    * **Retention**: Appointment records must be retained for at least 7 years.
* **Consistency Model**:
    * **Strong Consistency** is required for the appointment booking and cancellation process.
    * Users must see their own updated appointments immediately (**Read-your-writes consistency**).

**5. Deliverables**

1.  ✅ **High-Level Architecture Diagram**: A diagram showing the main components (e.g., API Gateway, Load Balancer, Application Servers, Database, Cache, Notification Service) and how they interact.
    - See: `diagrams/high_level/v3.1.drawio.svg`
2.  ✅ **API Surface Outline**: A list of the core API endpoints. For example: `POST /appointments`, `GET /doctors/{doctor_id}/availability`, etc.
    - See: `docs/apis/` folder with detailed specifications
3.  ✅ **Data Model Sketch**: A simple description or ERD of the key database tables (e.g., `Patients`, `Doctors`, `Appointments`, `TimeSlots`) including their essential fields and relationships.
    - See: `diagrams/erd/erd_v2.0.drawio.svg` and `src/prisma/schema.prisma`
4.  ✅ **Capacity Estimates & Bottleneck Analysis**: A brief, back-of-the-envelope calculation for the required resources based on the traffic estimates. Discuss at least one potential performance bottleneck in the proposed design.
    - See: `Q&A.md` for detailed analysis

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js v18+
- pnpm (or npm)

### Quick Start
```bash
# 1. Clone and navigate
cd clinic_appointment_system

# 2. Start PostgreSQL
docker-compose up -d

# 3. Install dependencies
cd src
pnpm install

# 4. Run migrations
npm run prisma:migrate

# 5. Seed database
npx ts-node prisma/seed.ts

# 6. Start application
npm run start:dev

# 7. Access APIs
# - Application: http://localhost:3000
# - Swagger UI: http://localhost:8080
# - pgAdmin: http://localhost:5050
```

### Run Tests
```bash
# Comprehensive test suite
./run-tests.sh

# Individual test types
npm run test           # Unit tests
npm run test:e2e       # E2E tests
npm run test:smoke     # Quick smoke test (30s)
npm run test:load      # Full load test (8min)
npm run test:stress    # Stress test (60s)

# View load test reports
make report-smoke      # Open smoke test HTML report
make report-load       # Open load test HTML report
```

📖 **[k6 Migration Guide](./K6_MIGRATION_GUIDE.md)** - Details about the Artillery → k6 migration  
📖 **[k6 Quick Reference](./K6_QUICK_REFERENCE.md)** - k6 usage examples and patterns

## 📊 System Status

### Implemented Modules
| Module | Endpoints | Status | Test Coverage |
|--------|-----------|--------|---------------|
| Doctors | 4 | ✅ Complete | Unit + E2E |
| Appointments | 4 | ✅ Complete | Unit + E2E |
| Authentication | - | ⚠️ Pending | - |
| Notifications | - | 📋 Planned | - |
| Audit Trail | - | ⚠️ Partial | - |

### Database
- **Technology**: PostgreSQL 15
- **ORM**: Prisma
- **Entities**: 7 (User, DoctorProfile, PatientProfile, TimeSlot, Appointment, AuditAppointment, Notification)
- **Migrations**: Up to date
- **Test Data**: 5 doctors, 20 patients, 800 slots, 240 appointments

### Testing
- **Unit Tests**: 28+ test cases
- **E2E Tests**: 6 complete flows
- **Load Tests**: k6-based (smoke, load, stress tests)
- **Peak Load**: Up to 100 concurrent virtual users
- **HTML Reports**: Interactive charts and metrics
- **Coverage**: Target 85%+ for business logic

## 📖 Documentation

- **[TESTING.md](./docs/TESTING.md)**: Complete testing strategy and execution guide
- **[PRODUCTION_READINESS.md](./docs/PRODUCTION_READINESS.md)**: Production deployment checklist
- **[API Documentation](./docs/apis/)**: Detailed API specifications
- **[Postman Collections](./docs/postman/)**: Ready-to-use API test collections

## 🎯 Next Steps

### Before Production
1. ⚠️ Implement JWT authentication
2. ⚠️ Add rate limiting
3. ⚠️ Set up monitoring and logging
4. ⚠️ Security audit
5. ⚠️ Performance optimization based on load test results

### Future Enhancements
- Email/SMS notifications
- Appointment rescheduling
- Doctor notes and patient history
- Analytics dashboard
- Mobile app support

---

**Project Status**: Ready for staging deployment after authentication implementation.