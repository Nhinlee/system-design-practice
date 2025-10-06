import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus, UserRole } from '@prisma/client';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    appointment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    timeSlot: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAppointment', () => {
    const createDto = {
      slotId: 'slot-123',
      patientId: 'patient-123',
      notes: 'Annual checkup',
    };

    const currentUserId = 'user-123';
    const idempotencyKey = 'idempotency-key-123';

    const mockSlot = {
      id: 'slot-123',
      startTime: new Date('2025-10-15T10:00:00Z'),
      endTime: new Date('2025-10-15T10:30:00Z'),
      doctorId: 'doctor-123',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      doctor: {
        id: 'doctor-123',
        name: 'Dr. Smith',
        email: 'dr.smith@clinic.com',
        role: UserRole.DOCTOR,
        address: '123 Medical Plaza',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const mockAppointment = {
      id: 'appointment-123',
      slotId: 'slot-123',
      bookedByUserId: currentUserId,
      patientId: 'patient-123',
      status: AppointmentStatus.BOOKED,
      notes: 'Annual checkup',
      idempotencyKey,
      createdAt: new Date(),
      updatedAt: new Date(),
      slot: mockSlot,
      bookedByUser: {
        id: currentUserId,
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.PATIENT,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      patient: {
        id: 'patient-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.PATIENT,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should create an appointment successfully', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockSlot);
      mockPrismaService.appointment.create.mockResolvedValue(mockAppointment);

      const result = await service.createAppointment(
        createDto,
        currentUserId,
        idempotencyKey,
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('appointment-123');
      expect(result.data.status).toBe(AppointmentStatus.BOOKED);
      expect(mockPrismaService.appointment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slotId: createDto.slotId,
            patientId: createDto.patientId,
            bookedByUserId: currentUserId,
            idempotencyKey,
            notes: createDto.notes,
          }),
        }),
      );
    });

    it('should return existing appointment if idempotency key matches', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue(
        mockAppointment,
      );

      const result = await service.createAppointment(
        createDto,
        currentUserId,
        idempotencyKey,
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('appointment-123');
      expect(mockPrismaService.appointment.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if slot does not exist', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(null);

      await expect(
        service.createAppointment(createDto, currentUserId, idempotencyKey),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if slot is deleted', async () => {
      mockPrismaService.appointment.findFirst.mockResolvedValue(null);
      mockPrismaService.timeSlot.findUnique.mockResolvedValue({
        ...mockSlot,
        deletedAt: new Date(),
      });

      await expect(
        service.createAppointment(createDto, currentUserId, idempotencyKey),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if slot is in the past', async () => {
      const pastSlot = {
        ...mockSlot,
        startTime: new Date('2020-01-01T10:00:00Z'),
        endTime: new Date('2020-01-01T10:30:00Z'),
      };

      mockPrismaService.appointment.findFirst.mockResolvedValue(null);
      mockPrismaService.timeSlot.findUnique.mockResolvedValue(pastSlot);

      await expect(
        service.createAppointment(createDto, currentUserId, idempotencyKey),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createAppointment(createDto, currentUserId, idempotencyKey),
      ).rejects.toThrow('Cannot book appointments in the past');
    });

    it('should throw ConflictException if slot is already booked', async () => {
      mockPrismaService.appointment.findFirst
        .mockResolvedValueOnce(null) // idempotency check
        .mockResolvedValueOnce(mockAppointment); // double-booking check

      mockPrismaService.timeSlot.findUnique.mockResolvedValue(mockSlot);

      await expect(
        service.createAppointment(createDto, currentUserId, idempotencyKey),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createAppointment(createDto, currentUserId, idempotencyKey),
      ).rejects.toThrow('This time slot is already booked');
    });
  });

  describe('listAppointments', () => {
    const currentUserId = 'user-123';

    const mockAppointments = [
      {
        id: 'appointment-1',
        slotId: 'slot-1',
        bookedByUserId: currentUserId,
        patientId: currentUserId,
        status: AppointmentStatus.BOOKED,
        notes: null,
        idempotencyKey: 'key-1',
        createdAt: new Date('2025-10-01T10:00:00Z'),
        updatedAt: new Date('2025-10-01T10:00:00Z'),
        slot: {
          id: 'slot-1',
          startTime: new Date('2025-10-15T10:00:00Z'),
          endTime: new Date('2025-10-15T10:30:00Z'),
          doctorId: 'doctor-1',
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          doctor: {
            id: 'doctor-1',
            name: 'Dr. Smith',
            email: 'dr.smith@clinic.com',
            role: UserRole.DOCTOR,
            address: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            doctorProfile: {
              id: 'profile-1',
              userId: 'doctor-1',
              specialty: 'Cardiology',
              shortDescription: 'Heart specialist',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
        bookedByUser: {
          id: currentUserId,
          name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.PATIENT,
          address: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        patient: {
          id: currentUserId,
          name: 'John Doe',
          email: 'john@example.com',
          role: UserRole.PATIENT,
          address: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    ];

    it('should list appointments for patient (filtered by patientId)', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue(
        mockAppointments,
      );
      mockPrismaService.appointment.count.mockResolvedValue(1);

      const result = await service.listAppointments(
        {},
        currentUserId,
        UserRole.PATIENT,
      );

      expect(result.success).toBe(true);
      expect(result.data.items).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patientId: currentUserId,
          }),
        }),
      );
    });

    it('should list appointments for doctor (filtered by doctorId via slot)', async () => {
      const doctorId = 'doctor-1';
      mockPrismaService.appointment.findMany.mockResolvedValue(
        mockAppointments,
      );
      mockPrismaService.appointment.count.mockResolvedValue(1);

      const result = await service.listAppointments(
        {},
        doctorId,
        UserRole.DOCTOR,
      );

      expect(result.success).toBe(true);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            slot: {
              doctorId,
            },
          }),
        }),
      );
    });

    it('should list all appointments for admin (no filter)', async () => {
      const adminId = 'admin-1';
      mockPrismaService.appointment.findMany.mockResolvedValue(
        mockAppointments,
      );
      mockPrismaService.appointment.count.mockResolvedValue(1);

      const result = await service.listAppointments(
        {},
        adminId,
        UserRole.ADMIN,
      );

      expect(result.success).toBe(true);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            patientId: expect.anything(),
            slot: expect.anything(),
          }),
        }),
      );
    });

    it('should filter appointments by status', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.count.mockResolvedValue(0);

      await service.listAppointments(
        { status: AppointmentStatus.BOOKED },
        currentUserId,
        UserRole.PATIENT,
      );

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: AppointmentStatus.BOOKED,
          }),
        }),
      );
    });

    it('should filter appointments by date range', async () => {
      const startDate = new Date('2025-10-01T00:00:00Z');
      const endDate = new Date('2025-10-31T23:59:59Z');

      mockPrismaService.appointment.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.count.mockResolvedValue(0);

      await service.listAppointments(
        { start_date: startDate, end_date: endDate },
        currentUserId,
        UserRole.PATIENT,
      );

      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            slot: {
              startTime: {
                gte: startDate,
                lte: endDate,
              },
            },
          }),
        }),
      );
    });

    it('should apply pagination correctly', async () => {
      mockPrismaService.appointment.findMany.mockResolvedValue([]);
      mockPrismaService.appointment.count.mockResolvedValue(100);

      const result = await service.listAppointments(
        { page: 2, limit: 20 },
        currentUserId,
        UserRole.PATIENT,
      );

      expect(result.data.pagination.page).toBe(2);
      expect(result.data.pagination.limit).toBe(20);
      expect(result.data.pagination.total).toBe(100);
      expect(result.data.pagination.totalPages).toBe(5);
      expect(mockPrismaService.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (page - 1) * limit
          take: 20,
        }),
      );
    });
  });

  describe('getAppointmentById', () => {
    const appointmentId = 'appointment-123';
    const currentUserId = 'user-123';

    const mockAppointment = {
      id: appointmentId,
      slotId: 'slot-123',
      bookedByUserId: currentUserId,
      patientId: currentUserId,
      status: AppointmentStatus.BOOKED,
      notes: 'Test notes',
      idempotencyKey: 'key-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      slot: {
        id: 'slot-123',
        startTime: new Date('2025-10-15T10:00:00Z'),
        endTime: new Date('2025-10-15T10:30:00Z'),
        doctorId: 'doctor-123',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctor: {
          id: 'doctor-123',
          name: 'Dr. Smith',
          email: 'dr.smith@clinic.com',
          role: UserRole.DOCTOR,
          address: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          doctorProfile: {
            id: 'profile-123',
            userId: 'doctor-123',
            specialty: 'Cardiology',
            shortDescription: 'Heart specialist',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
      bookedByUser: {
        id: currentUserId,
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.PATIENT,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      patient: {
        id: currentUserId,
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.PATIENT,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should get appointment successfully for patient owner', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(
        mockAppointment,
      );

      const result = await service.getAppointmentById(
        appointmentId,
        currentUserId,
        UserRole.PATIENT,
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(appointmentId);
    });

    it('should get appointment successfully for doctor', async () => {
      const doctorId = 'doctor-123';
      mockPrismaService.appointment.findUnique.mockResolvedValue(
        mockAppointment,
      );

      const result = await service.getAppointmentById(
        appointmentId,
        doctorId,
        UserRole.DOCTOR,
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(appointmentId);
    });

    it('should get appointment successfully for admin', async () => {
      const adminId = 'admin-123';
      mockPrismaService.appointment.findUnique.mockResolvedValue(
        mockAppointment,
      );

      const result = await service.getAppointmentById(
        appointmentId,
        adminId,
        UserRole.ADMIN,
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(appointmentId);
    });

    it('should throw NotFoundException if appointment does not exist', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(
        service.getAppointmentById(
          appointmentId,
          currentUserId,
          UserRole.PATIENT,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      const unauthorizedUserId = 'other-user-123';
      mockPrismaService.appointment.findUnique.mockResolvedValue(
        mockAppointment,
      );

      await expect(
        service.getAppointmentById(
          appointmentId,
          unauthorizedUserId,
          UserRole.PATIENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelAppointment', () => {
    const appointmentId = 'appointment-123';
    const currentUserId = 'user-123';

    const mockAppointment = {
      id: appointmentId,
      slotId: 'slot-123',
      bookedByUserId: currentUserId,
      patientId: currentUserId,
      status: AppointmentStatus.BOOKED,
      notes: 'Test notes',
      idempotencyKey: 'key-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      slot: {
        id: 'slot-123',
        startTime: new Date('2025-10-15T10:00:00Z'),
        endTime: new Date('2025-10-15T10:30:00Z'),
        doctorId: 'doctor-123',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        doctor: {
          id: 'doctor-123',
          name: 'Dr. Smith',
          email: 'dr.smith@clinic.com',
          role: UserRole.DOCTOR,
          address: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          doctorProfile: {
            id: 'profile-123',
            userId: 'doctor-123',
            specialty: 'Cardiology',
            shortDescription: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
      bookedByUser: {
        id: currentUserId,
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.PATIENT,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      patient: {
        id: currentUserId,
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.PATIENT,
        address: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should cancel appointment successfully', async () => {
      const updatedAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(
        mockAppointment,
      );
      mockPrismaService.appointment.update.mockResolvedValue(
        updatedAppointment,
      );

      const result = await service.cancelAppointment(
        appointmentId,
        currentUserId,
        UserRole.PATIENT,
      );

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(AppointmentStatus.CANCELLED);
      expect(mockPrismaService.appointment.update).toHaveBeenCalledWith({
        where: { id: appointmentId },
        data: { status: AppointmentStatus.CANCELLED },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if appointment does not exist', async () => {
      mockPrismaService.appointment.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelAppointment(
          appointmentId,
          currentUserId,
          UserRole.PATIENT,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not authorized', async () => {
      const unauthorizedUserId = 'other-user-123';
      mockPrismaService.appointment.findUnique.mockResolvedValue(
        mockAppointment,
      );

      await expect(
        service.cancelAppointment(
          appointmentId,
          unauthorizedUserId,
          UserRole.PATIENT,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if appointment is already cancelled', async () => {
      const cancelledAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.CANCELLED,
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(
        cancelledAppointment,
      );

      await expect(
        service.cancelAppointment(
          appointmentId,
          currentUserId,
          UserRole.PATIENT,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancelAppointment(
          appointmentId,
          currentUserId,
          UserRole.PATIENT,
        ),
      ).rejects.toThrow('Appointment is already cancelled');
    });

    it('should throw BadRequestException if appointment is completed', async () => {
      const completedAppointment = {
        ...mockAppointment,
        status: AppointmentStatus.COMPLETED,
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(
        completedAppointment,
      );

      await expect(
        service.cancelAppointment(
          appointmentId,
          currentUserId,
          UserRole.PATIENT,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancelAppointment(
          appointmentId,
          currentUserId,
          UserRole.PATIENT,
        ),
      ).rejects.toThrow('Cannot cancel a completed appointment');
    });

    it('should throw BadRequestException if appointment is in the past', async () => {
      const pastAppointment = {
        ...mockAppointment,
        slot: {
          ...mockAppointment.slot,
          startTime: new Date('2020-01-01T10:00:00Z'),
        },
      };

      mockPrismaService.appointment.findUnique.mockResolvedValue(
        pastAppointment,
      );

      await expect(
        service.cancelAppointment(
          appointmentId,
          currentUserId,
          UserRole.PATIENT,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.cancelAppointment(
          appointmentId,
          currentUserId,
          UserRole.PATIENT,
        ),
      ).rejects.toThrow('Cannot cancel past appointments');
    });
  });
});
