### System Design Problem: Clinic Appointment System (CAS)

**1. Overview**

* **System**: Clinic Appointment System
* **Core Function**: Build a service for patients to see a doctor's real-time availability and book, reschedule, or cancel appointments for a single clinic facility.

**2. Requirements (MVP CORE ONLY)**

* **User Roles & Core Features**:
    * For the **Patient**:
        * Authenticate via email/OTP.
        * View a list of doctors and their available time slots.
        * Book an appointment for an available time slot.
        * View and cancel their own upcoming appointments.
        * Receive email notifications for appointment confirmation and reminders.
    * For the **Doctor/Clinic Staff**:
        * Define their weekly availability (e.g., Mon 9 AM - 5 PM, Tue 10 AM - 6 PM).
        * View a calendar of their upcoming appointments.
        * Cancel an appointment (which should notify the patient).

* **System Behavior**:
    * **Critical Requirement #1**: The system must prevent double-booking of any time slot.
    * **Critical Requirement #2**: Key actions (booking, canceling) must be idempotent to allow for safe client-side retries.
    * **Critical Requirement #3**: A basic audit trail must be kept for all appointment state changes (e.g., `booked`, `cancelled`).

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

1.  **High-Level Architecture Diagram**: A diagram showing the main components (e.g., API Gateway, Load Balancer, Application Servers, Database, Cache, Notification Service) and how they interact.
2.  **API Surface Outline**: A list of the core API endpoints. For example: `POST /appointments`, `GET /doctors/{doctor_id}/availability`, etc.
3.  **Data Model Sketch**: A simple description or ERD of the key database tables (e.g., `Patients`, `Doctors`, `Appointments`, `TimeSlots`) including their essential fields and relationships.
4.  **Capacity Estimates & Bottleneck Analysis**: A brief, back-of-the-envelope calculation for the required resources based on the traffic estimates. Discuss at least one potential performance bottleneck in the proposed design.