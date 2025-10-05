import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto, ListAppointmentsQueryDto } from './dto';
import { AppointmentStatus, UserRole, Prisma } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new appointment with double-booking prevention
   * Supports idempotency through idempotency-key header
   */
  async createAppointment(
    dto: CreateAppointmentDto,
    bookedByUserId: string,
    idempotencyKey?: string,
  ) {
    // If idempotency key provided, check if appointment already exists
    if (idempotencyKey) {
      const existingAppointment = await this.prisma.appointment.findFirst({
        where: {
          idempotencyKey,
          status: AppointmentStatus.BOOKED,
        },
        include: {
          slot: {
            include: {
              doctor: {
                include: {
                  doctorProfile: true,
                },
              },
            },
          },
          patient: true,
          bookedByUser: true,
        },
      });

      if (existingAppointment) {
        // Return existing appointment (idempotent behavior)
        return {
          success: true,
          data: this.transformAppointment(existingAppointment),
          message: 'Appointment already exists (idempotent)',
        };
      }
    }

    // Validate time slot exists and is available
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id: dto.slotId },
      include: {
        appointments: {
          where: {
            status: AppointmentStatus.BOOKED,
          },
        },
        doctor: {
          include: {
            doctorProfile: true,
          },
        },
      },
    });

    if (!slot) {
      throw new NotFoundException('Time slot not found');
    }

    if (slot.deletedAt) {
      throw new BadRequestException('Time slot is no longer available');
    }

    // Check if slot is in the past
    if (slot.startTime < new Date()) {
      throw new BadRequestException('Cannot book appointments in the past');
    }

    // Double-booking prevention
    if (slot.appointments.length > 0) {
      throw new ConflictException(
        'This time slot is already booked. Please select another time.',
      );
    }

    // Validate patient exists
    const patient = await this.prisma.user.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient || patient.role !== UserRole.PATIENT) {
      throw new NotFoundException('Patient not found');
    }

    // Validate bookedBy user exists
    const bookedBy = await this.prisma.user.findUnique({
      where: { id: bookedByUserId },
    });

    if (!bookedBy) {
      throw new NotFoundException('User not found');
    }

    // Authorization: Only patients can book for themselves or admins can book for anyone
    // TODO: Implement proper role-based authorization
    // For now, allow booking

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        slotId: dto.slotId,
        patientId: dto.patientId,
        bookedByUserId: bookedByUserId,
        status: AppointmentStatus.BOOKED,
        notes: dto.notes || null,
        idempotencyKey,
      },
      include: {
        slot: {
          include: {
            doctor: {
              include: {
                doctorProfile: true,
              },
            },
          },
        },
        patient: true,
        bookedByUser: true,
      },
    });

    return {
      success: true,
      data: this.transformAppointment(appointment),
      message: 'Appointment booked successfully',
    };
  }

  /**
   * List appointments with role-based filtering
   */
  async listAppointments(
    query: ListAppointmentsQueryDto,
    currentUserId: string,
    currentUserRole: UserRole,
  ) {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      doctorId,
      patientId,
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const where: Prisma.AppointmentWhereInput = {};

    // Role-based filtering
    if (currentUserRole === UserRole.PATIENT) {
      // Patients see only their own appointments
      where.patientId = currentUserId;

      // Allow filtering by doctor
      if (doctorId) {
        where.slot = {
          doctorId,
        };
      }
    } else if (currentUserRole === UserRole.DOCTOR) {
      // Doctors see appointments scheduled with them
      where.slot = {
        doctorId: currentUserId,
      };

      // Allow filtering by patient
      if (patientId) {
        where.patientId = patientId;
      }
    } else {
      // Admins see all appointments
      // Allow filtering by both doctor and patient
      if (doctorId) {
        where.slot = {
          doctorId,
        };
      }
      if (patientId) {
        where.patientId = patientId;
      }
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      where.slot = {
        ...where.slot,
      };

      if (startDate && endDate) {
        where.slot.startTime = {
          gte: new Date(startDate),
          lte: new Date(endDate),
        };
      } else if (startDate) {
        where.slot.startTime = {
          gte: new Date(startDate),
        };
      } else if (endDate) {
        where.slot.startTime = {
          lte: new Date(endDate),
        };
      }
    }

    // Get total count
    const total = await this.prisma.appointment.count({ where });

    // Get appointments
    const appointments = await this.prisma.appointment.findMany({
      where,
      skip,
      take: limit,
      include: {
        slot: {
          include: {
            doctor: {
              include: {
                doctorProfile: true,
              },
            },
          },
        },
        patient: true,
        bookedByUser: true,
      },
      orderBy: {
        slot: {
          startTime: 'asc',
        },
      },
    });

    return {
      success: true,
      data: appointments.map((apt) => this.transformAppointment(apt)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get specific appointment by ID
   */
  async getAppointmentById(
    id: string,
    currentUserId: string,
    currentUserRole: UserRole,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        slot: {
          include: {
            doctor: {
              include: {
                doctorProfile: true,
              },
            },
          },
        },
        patient: true,
        bookedByUser: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Authorization check
    const isPatient =
      currentUserRole === UserRole.PATIENT &&
      appointment.patientId === currentUserId;
    const isDoctor =
      currentUserRole === UserRole.DOCTOR &&
      appointment.slot.doctorId === currentUserId;
    const isAdmin = currentUserRole === UserRole.ADMIN;

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to view this appointment',
      );
    }

    return {
      success: true,
      data: this.transformAppointment(appointment),
    };
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    id: string,
    currentUserId: string,
    currentUserRole: UserRole,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        slot: {
          include: {
            doctor: true,
          },
        },
        patient: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check if already cancelled
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    // Check if already completed
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    // Authorization: Patient can cancel their own, doctor can cancel theirs, admin can cancel any
    const isPatient =
      currentUserRole === UserRole.PATIENT &&
      appointment.patientId === currentUserId;
    const isDoctor =
      currentUserRole === UserRole.DOCTOR &&
      appointment.slot.doctorId === currentUserId;
    const isAdmin = currentUserRole === UserRole.ADMIN;

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to cancel this appointment',
      );
    }

    // Check if appointment is in the past
    if (appointment.slot.startTime < new Date()) {
      throw new BadRequestException('Cannot cancel appointments in the past');
    }

    // Update appointment status
    const cancelled = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        id: cancelled.id,
        status: cancelled.status,
        cancelledAt: cancelled.updatedAt,
      },
    };
  }

  /**
   * Transform appointment data for response
   */
  private transformAppointment(appointment: any) {
    return {
      id: appointment.id,
      status: appointment.status,
      notes: appointment.notes,
      slot: {
        id: appointment.slot.id,
        startTime: appointment.slot.startTime,
        endTime: appointment.slot.endTime,
      },
      doctor: {
        id: appointment.slot.doctor.id,
        name: appointment.slot.doctor.name,
        specialty:
          appointment.slot.doctor.doctorProfile?.specialty || 'General',
      },
      patient: {
        id: appointment.patient.id,
        name: appointment.patient.name,
      },
      bookedBy: {
        id: appointment.bookedByUser.id,
        name: appointment.bookedByUser.name,
      },
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }
}
