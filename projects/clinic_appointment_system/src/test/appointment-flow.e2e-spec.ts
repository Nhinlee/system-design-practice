import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { default as supertest } from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { AppointmentStatus, UserRole } from '@prisma/client';

describe('Appointment Booking Flow (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data IDs
  let doctorId: string;
  let patientId: string;
  let slotId: string;
  let appointmentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    
    prisma = app.get<PrismaService>(PrismaService);
    
    await app.init();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create doctor
    const doctor = await prisma.user.create({
      data: {
        id: 'e2e-doctor-001',
        email: 'dr.e2e@clinic.com',
        name: 'Dr. E2E Test',
        role: UserRole.DOCTOR,
      },
    });
    doctorId = doctor.id;

    await prisma.doctorProfile.create({
      data: {
        id: 'e2e-profile-001',
        userId: doctorId,
        specialty: 'Cardiology',
        shortDescription: 'E2E Test Doctor',
      },
    });

    // Create patient
    const patient = await prisma.user.create({
      data: {
        id: 'e2e-patient-001',
        email: 'patient.e2e@example.com',
        name: 'E2E Patient',
        role: UserRole.PATIENT,
      },
    });
    patientId = patient.id;

    await prisma.patientProfile.create({
      data: {
        id: 'e2e-patient-profile-001',
        userId: patientId,
        dateOfBirth: new Date('1990-01-01'),
      },
    });

    // Create time slot (future date)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    futureDate.setHours(10, 0, 0, 0);

    const slot = await prisma.timeSlot.create({
      data: {
        id: 'e2e-slot-001',
        doctorId,
        startTime: futureDate,
        endTime: new Date(futureDate.getTime() + 30 * 60000), // +30 minutes
      },
    });
    slotId = slot.id;
  }

  async function cleanupTestData() {
    await prisma.appointment.deleteMany({
      where: { id: { startsWith: 'e2e-' } },
    });
    await prisma.timeSlot.deleteMany({
      where: { id: { startsWith: 'e2e-' } },
    });
    await prisma.patientProfile.deleteMany({
      where: { id: { startsWith: 'e2e-' } },
    });
    await prisma.doctorProfile.deleteMany({
      where: { id: { startsWith: 'e2e-' } },
    });
    await prisma.user.deleteMany({
      where: { id: { startsWith: 'e2e-' } },
    });
  }

  describe('Complete Booking Flow', () => {
    it('should complete full booking lifecycle: create → view → cancel', async () => {
      // Step 1: Create appointment
      const createResponse = await supertest(app.getHttpServer())
        .post('/appointments')
        .set('Idempotency-Key', 'e2e-test-idempotency-key')
        .send({
          slotId,
          patientId,
          notes: 'E2E test appointment',
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data).toHaveProperty('id');
      expect(createResponse.body.data.status).toBe(AppointmentStatus.BOOKED);
      appointmentId = createResponse.body.data.id;

      // Step 2: Verify appointment was created
      const getResponse = await supertest(app.getHttpServer())
        .get(`/appointments/${appointmentId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.id).toBe(appointmentId);
      expect(getResponse.body.data.notes).toBe('E2E test appointment');

      // Step 3: List appointments and verify it appears
      const listResponse = await supertest(app.getHttpServer())
        .get('/appointments')
        .query({ status: AppointmentStatus.BOOKED })
        .expect(200);

      expect(listResponse.body.success).toBe(true);
      expect(listResponse.body.data.items.length).toBeGreaterThan(0);
      const foundAppointment = listResponse.body.data.items.find(
        (apt: { id: string }) => apt.id === appointmentId,
      );
      expect(foundAppointment).toBeDefined();

      // Step 4: Cancel appointment
      const cancelResponse = await supertest(app.getHttpServer())
        .delete(`/appointments/${appointmentId}`)
        .expect(200);

      expect(cancelResponse.body.success).toBe(true);
      expect(cancelResponse.body.data.status).toBe(
        AppointmentStatus.CANCELLED,
      );

      // Step 5: Verify appointment is cancelled
      const verifyResponse = await supertest(app.getHttpServer())
        .get(`/appointments/${appointmentId}`)
        .expect(200);

      expect(verifyResponse.body.data.status).toBe(
        AppointmentStatus.CANCELLED,
      );
    });

    it('should handle idempotency correctly', async () => {
      const idempotencyKey = 'e2e-idempotency-test-2';

      // First request
      const firstResponse = await supertest(app.getHttpServer())
        .post('/appointments')
        .set('Idempotency-Key', idempotencyKey)
        .send({
          slotId,
          patientId,
          notes: 'Idempotency test',
        })
        .expect(201);

      const firstAppointmentId = firstResponse.body.data.id;

      // Duplicate request with same idempotency key
      const secondResponse = await supertest(app.getHttpServer())
        .post('/appointments')
        .set('Idempotency-Key', idempotencyKey)
        .send({
          slotId,
          patientId,
          notes: 'Idempotency test',
        })
        .expect(201);

      // Should return the same appointment
      expect(secondResponse.body.data.id).toBe(firstAppointmentId);

      // Cleanup
      await prisma.appointment.delete({
        where: { id: firstAppointmentId },
      });
    });

    it('should prevent double-booking of the same slot', async () => {
      // Create another patient
      const patient2 = await prisma.user.create({
        data: {
          id: 'e2e-patient-002',
          email: 'patient2.e2e@example.com',
          name: 'E2E Patient 2',
          role: UserRole.PATIENT,
        },
      });

      await prisma.patientProfile.create({
        data: {
          id: 'e2e-patient-profile-002',
          userId: patient2.id,
          dateOfBirth: new Date('1995-05-05'),
        },
      });

      // Create another slot
      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 8);
      futureDate2.setHours(14, 0, 0, 0);

      const slot2 = await prisma.timeSlot.create({
        data: {
          id: 'e2e-slot-002',
          doctorId,
          startTime: futureDate2,
          endTime: new Date(futureDate2.getTime() + 30 * 60000),
        },
      });

      // First patient books the slot
      const booking1 = await supertest(app.getHttpServer())
        .post('/appointments')
        .set('Idempotency-Key', 'e2e-double-booking-1')
        .send({
          slotId: slot2.id,
          patientId,
          notes: 'First booking',
        })
        .expect(201);

      expect(booking1.body.success).toBe(true);

      // Second patient tries to book the same slot - should fail
      const booking2 = await supertest(app.getHttpServer())
        .post('/appointments')
        .set('Idempotency-Key', 'e2e-double-booking-2')
        .send({
          slotId: slot2.id,
          patientId: patient2.id,
          notes: 'Second booking attempt',
        })
        .expect(409);

      expect(booking2.body.success).toBe(false);
      expect(booking2.body.message).toContain('already booked');

      // Cleanup
      await prisma.appointment.delete({
        where: { id: booking1.body.data.id },
      });
    });

    it('should prevent booking past appointments', async () => {
      // Create a past slot
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      pastDate.setHours(10, 0, 0, 0);

      const pastSlot = await prisma.timeSlot.create({
        data: {
          id: 'e2e-past-slot',
          doctorId,
          startTime: pastDate,
          endTime: new Date(pastDate.getTime() + 30 * 60000),
        },
      });

      // Attempt to book past slot
      const response = await supertest(app.getHttpServer())
        .post('/appointments')
        .set('Idempotency-Key', 'e2e-past-booking')
        .send({
          slotId: pastSlot.id,
          patientId,
          notes: 'Past booking attempt',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('past');

      // Cleanup
      await prisma.timeSlot.delete({
        where: { id: pastSlot.id },
      });
    });

    it('should prevent cancelling past appointments', async () => {
      // Create a past appointment
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      pastDate.setHours(10, 0, 0, 0);

      const pastSlot = await prisma.timeSlot.create({
        data: {
          id: 'e2e-past-slot-cancel',
          doctorId,
          startTime: pastDate,
          endTime: new Date(pastDate.getTime() + 30 * 60000),
        },
      });

      // Force create a past appointment
      const pastAppointment = await prisma.appointment.create({
        data: {
          id: 'e2e-past-appointment',
          slotId: pastSlot.id,
          patientId,
          bookedByUserId: patientId,
          status: AppointmentStatus.BOOKED,
        },
      });

      // Attempt to cancel past appointment
      const response = await supertest(app.getHttpServer())
        .delete(`/appointments/${pastAppointment.id}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('past');

      // Cleanup
      await prisma.appointment.delete({
        where: { id: pastAppointment.id },
      });
      await prisma.timeSlot.delete({
        where: { id: pastSlot.id },
      });
    });
  });

  describe('Doctor Schedule Management', () => {
    it('should create doctor schedule and list available slots', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const startTime = new Date(tomorrow);
      startTime.setHours(9, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(17, 0, 0, 0);

      // Create schedule via API
      const createResponse = await supertest(app.getHttpServer())
        .post(`/doctors/${doctorId}/schedule`)
        .send({
          date: tomorrow.toISOString(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          slotDurationMinutes: 30,
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      expect(createResponse.body.data.slots.length).toBeGreaterThan(0);

      // Get availability
      const availabilityResponse = await supertest(app.getHttpServer())
        .get(`/doctors/${doctorId}/availability`)
        .query({
          start_date: tomorrow.toISOString(),
          end_date: endTime.toISOString(),
        })
        .expect(200);

      expect(availabilityResponse.body.success).toBe(true);
      expect(availabilityResponse.body.data.length).toBeGreaterThan(0);
    });
  });
});
