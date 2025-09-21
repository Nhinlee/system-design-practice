# Clinic Appointment System - Requirements Clarification

This document summarizes the clarifying questions asked and the answers provided during the initial phase of the system design process.

---

### Question 1: What is the meaning of "preventing double-booking"?

**Question:** Can you explain "double-booking"? Does it mean preventing two users from booking the same doctor at the same time?

**Answer:** Yes, precisely. "Preventing double-booking" is a critical requirement to ensure that one specific time slot for one specific doctor can only be successfully booked by a single patient. The system must handle **race conditions**, where multiple users see a slot as "available" and try to book it simultaneously. The solution must guarantee that only the first confirmed booking succeeds, and all subsequent attempts for that same slot fail. This requires the "check availability and book" operation to be **atomic**.

---

### Question 2: How does a patient book an appointment within a doctor's available time range?

**Question:** If a doctor is available from 9 AM to 11 AM, can a patient book a flexible time, or is it for a fixed duration?

**Answer:** For the MVP, we will use a **fixed-duration slot model**. A doctor's availability block (e.g., 9 AM - 11 AM) will be automatically divided into discrete, individually bookable slots of a standard length (e.g., 30 minutes).

* **Example:** A 9 AM - 11 AM availability would become four distinct slots: `9:00 AM`, `9:30 AM`, `10:00 AM`, and `10:30 AM`.

Patients will see and book one of these specific slots. Flexible or custom-duration appointments are not within the scope of the MVP.

---

### Question 3: What is the purpose of the Audit Trail and is it critical?

**Question:** Why do we need an audit trail for this system, and is it a critical requirement?

**Answer:** An audit trail is a chronological log that records **who** performed **what** action and **when**. It is a **critical requirement** for this system for three main reasons:

1.  **Accountability & Dispute Resolution:** To definitively answer questions like "Who cancelled this appointment?" and resolve issues between patients and staff.
2.  **Troubleshooting & Debugging:** To provide a clear sequence of events for developers to diagnose bugs or data inconsistencies.
3.  **Security & Compliance:** To track access and modifications to sensitive patient data (PII), which is often a legal or regulatory requirement in healthcare.

For the MVP, a basic implementation is required to ensure the system is trustworthy, secure, and operationally sound.
