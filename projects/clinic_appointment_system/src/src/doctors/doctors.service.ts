import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListDoctorsQueryDto } from './dto/list-doctors-query.dto';
import { GetAvailabilityQueryDto } from './dto/get-availability-query.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { UserRole, AppointmentStatus, Prisma } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get paginated list of doctors with optional filtering
   */
  async listDoctors(query: ListDoctorsQueryDto) {
    const { page = 1, limit = 20, specialty, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause with proper Prisma types
    const where: Prisma.UserWhereInput = {
      role: UserRole.DOCTOR,
    };

    if (specialty || search) {
      where.doctorProfile = {};

      if (specialty) {
        where.doctorProfile.specialty = {
          contains: specialty,
          mode: 'insensitive',
        };
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          {
            doctorProfile: {
              specialty: { contains: search, mode: 'insensitive' },
            },
          },
        ];
      }
    }

    // Get total count
    const total = await this.prisma.user.count({ where });

    // Get doctors
    const doctors = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        doctorProfile: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Transform response
    const data = doctors.map((doctor) => ({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      address: doctor.address,
      profile: doctor.doctorProfile
        ? {
            specialty: doctor.doctorProfile.specialty,
            shortDescription: doctor.doctorProfile.shortDescription,
          }
        : null,
    }));

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get detailed information about a specific doctor
   */
  async getDoctorById(id: string) {
    const doctor = await this.prisma.user.findUnique({
      where: { id },
      include: {
        doctorProfile: true,
      },
    });

    if (!doctor || doctor.role !== UserRole.DOCTOR) {
      throw new NotFoundException('Doctor not found');
    }

    return {
      success: true,
      data: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        role: doctor.role,
        address: doctor.address,
        profile: doctor.doctorProfile
          ? {
              id: doctor.doctorProfile.id,
              specialty: doctor.doctorProfile.specialty,
              shortDescription: doctor.doctorProfile.shortDescription,
              createdAt: doctor.doctorProfile.createdAt,
            }
          : null,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt,
      },
    };
  }

  /**
   * Get doctor's availability within a date range
   */
  async getAvailability(doctorId: string, query: GetAvailabilityQueryDto) {
    const { start_date, end_date } = query;

    // Validate doctor exists
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
      include: { doctorProfile: true },
    });

    if (!doctor || doctor.role !== UserRole.DOCTOR) {
      throw new NotFoundException('Doctor not found');
    }

    // Validate date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (startDate >= endDate) {
      throw new BadRequestException('end_date must be after start_date');
    }

    // Check if date range exceeds 30 days
    const daysDiff =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 30) {
      throw new BadRequestException('Date range cannot exceed 30 days');
    }

    // Get all time slots for doctor in date range (excluding soft-deleted)
    const slots = await this.prisma.timeSlot.findMany({
      where: {
        doctorId,
        deletedAt: null,
        startTime: {
          gte: startDate,
        },
        endTime: {
          lte: endDate,
        },
      },
      include: {
        appointments: {
          where: {
            status: AppointmentStatus.BOOKED,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Transform slots and check if booked
    const availableSlots = slots.map((slot) => ({
      id: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: slot.appointments.length > 0,
    }));

    const totalSlots = slots.length;
    const bookedSlots = slots.filter((s) => s.appointments.length > 0).length;
    const availableSlotsCount = totalSlots - bookedSlots;

    return {
      success: true,
      data: {
        doctorId: doctor.id,
        doctorName: doctor.name,
        dateRange: {
          startDate: start_date,
          endDate: end_date,
        },
        availableSlots,
        summary: {
          totalSlots,
          availableSlots: availableSlotsCount,
          bookedSlots,
        },
      },
    };
  }

  /**
   * Update doctor's schedule (create/update/delete time slots)
   */
  async updateSchedule(
    doctorId: string,
    currentUserId: string,
    dto: UpdateScheduleDto,
  ) {
    // Validate doctor exists
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorId },
    });

    if (!doctor || doctor.role !== UserRole.DOCTOR) {
      throw new NotFoundException('Doctor not found');
    }

    // Authorization: Only the doctor themselves can update their schedule
    // (or admin in future)
    if (currentUserId !== doctorId) {
      throw new ForbiddenException('You can only update your own schedule');
    }

    // Validate time slots
    for (const slot of dto.timeSlots) {
      const start = new Date(slot.startTime);
      const end = new Date(slot.endTime);

      if (start >= end) {
        throw new BadRequestException(
          `Invalid time slot: endTime must be after startTime`,
        );
      }

      // Validate minimum slot duration (15 minutes)
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        throw new BadRequestException(
          'Time slots must be at least 15 minutes long',
        );
      }
    }

    // Check for overlapping slots in the request
    for (let i = 0; i < dto.timeSlots.length; i++) {
      for (let j = i + 1; j < dto.timeSlots.length; j++) {
        const slot1Start = new Date(dto.timeSlots[i].startTime);
        const slot1End = new Date(dto.timeSlots[i].endTime);
        const slot2Start = new Date(dto.timeSlots[j].startTime);
        const slot2End = new Date(dto.timeSlots[j].endTime);

        if (slot1Start < slot2End && slot2Start < slot1End) {
          throw new BadRequestException(
            `Time slots cannot overlap: ${dto.timeSlots[i].startTime} - ${dto.timeSlots[i].endTime} overlaps with ${dto.timeSlots[j].startTime} - ${dto.timeSlots[j].endTime}`,
          );
        }
      }
    }

    // Get existing time slots with appointments
    const existingSlots = await this.prisma.timeSlot.findMany({
      where: {
        doctorId,
        deletedAt: null,
      },
      include: {
        appointments: {
          where: {
            status: AppointmentStatus.BOOKED,
          },
        },
      },
    });

    // Check if any slot with active appointments is being deleted
    const newSlotTimes = dto.timeSlots.map((s) => ({
      start: new Date(s.startTime).toISOString(),
      end: new Date(s.endTime).toISOString(),
    }));

    for (const existingSlot of existingSlots) {
      const hasActiveAppointment = existingSlot.appointments.length > 0;
      const isInNewSchedule = newSlotTimes.some(
        (newSlot) =>
          newSlot.start === existingSlot.startTime.toISOString() &&
          newSlot.end === existingSlot.endTime.toISOString(),
      );

      if (hasActiveAppointment && !isInNewSchedule) {
        throw new ConflictException(
          `Cannot delete slot with active appointment. Slot: ${existingSlot.startTime.toISOString()}`,
        );
      }
    }

    // Separate slots into: existing to keep, new to create, old to delete
    const slotsToKeep: typeof existingSlots = [];
    const slotsToCreate: typeof dto.timeSlots = [];
    const slotsToDelete: typeof existingSlots = [];

    // Check each new slot against existing slots
    for (const newSlot of dto.timeSlots) {
      const newStart = new Date(newSlot.startTime).toISOString();
      const newEnd = new Date(newSlot.endTime).toISOString();

      const matchingExisting = existingSlots.find(
        (existing) =>
          existing.startTime.toISOString() === newStart &&
          existing.endTime.toISOString() === newEnd,
      );

      if (matchingExisting) {
        // Slot already exists, keep it
        slotsToKeep.push(matchingExisting);
      } else {
        // New slot to create
        slotsToCreate.push(newSlot);
      }
    }

    // Find slots to delete (existing slots not in new schedule)
    for (const existingSlot of existingSlots) {
      const hasActiveAppointment = existingSlot.appointments.length > 0;
      const isInNewSchedule = newSlotTimes.some(
        (newSlot) =>
          newSlot.start === existingSlot.startTime.toISOString() &&
          newSlot.end === existingSlot.endTime.toISOString(),
      );

      if (!isInNewSchedule && !hasActiveAppointment) {
        slotsToDelete.push(existingSlot);
      }
    }

    // Create only truly new slots
    const createdSlots = await Promise.all(
      slotsToCreate.map((slot) =>
        this.prisma.timeSlot.create({
          data: {
            startTime: new Date(slot.startTime),
            endTime: new Date(slot.endTime),
            doctorId,
          },
        }),
      ),
    );

    // Soft delete old slots
    if (slotsToDelete.length > 0) {
      await this.prisma.timeSlot.updateMany({
        where: {
          id: {
            in: slotsToDelete.map((s) => s.id),
          },
        },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    // Combine kept and created slots for response
    const allSlots = [
      ...slotsToKeep.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: slot.appointments.length > 0,
      })),
      ...createdSlots.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isBooked: false,
      })),
    ].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return {
      success: true,
      data: {
        created: createdSlots.length,
        kept: slotsToKeep.length,
        deleted: slotsToDelete.length,
        timeSlots: allSlots,
      },
      message: 'Schedule updated successfully',
    };
  }
}
