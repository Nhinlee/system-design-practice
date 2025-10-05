"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let DoctorsService = class DoctorsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listDoctors(query) {
        const { page = 1, limit = 20, specialty, search } = query;
        const skip = (page - 1) * limit;
        const where = {
            role: client_1.UserRole.DOCTOR,
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
        const total = await this.prisma.user.count({ where });
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
    async getDoctorById(id) {
        const doctor = await this.prisma.user.findUnique({
            where: { id },
            include: {
                doctorProfile: true,
            },
        });
        if (!doctor || doctor.role !== client_1.UserRole.DOCTOR) {
            throw new common_1.NotFoundException('Doctor not found');
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
    async getAvailability(doctorId, query) {
        const { start_date, end_date } = query;
        const doctor = await this.prisma.user.findUnique({
            where: { id: doctorId },
            include: { doctorProfile: true },
        });
        if (!doctor || doctor.role !== client_1.UserRole.DOCTOR) {
            throw new common_1.NotFoundException('Doctor not found');
        }
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        if (startDate >= endDate) {
            throw new common_1.BadRequestException('end_date must be after start_date');
        }
        const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff > 30) {
            throw new common_1.BadRequestException('Date range cannot exceed 30 days');
        }
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
                        status: client_1.AppointmentStatus.BOOKED,
                    },
                },
            },
            orderBy: {
                startTime: 'asc',
            },
        });
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
    async updateSchedule(doctorId, currentUserId, dto) {
        const doctor = await this.prisma.user.findUnique({
            where: { id: doctorId },
        });
        if (!doctor || doctor.role !== client_1.UserRole.DOCTOR) {
            throw new common_1.NotFoundException('Doctor not found');
        }
        if (currentUserId !== doctorId) {
            throw new common_1.ForbiddenException('You can only update your own schedule');
        }
        for (const slot of dto.timeSlots) {
            const start = new Date(slot.startTime);
            const end = new Date(slot.endTime);
            if (start >= end) {
                throw new common_1.BadRequestException(`Invalid time slot: endTime must be after startTime`);
            }
            const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
            if (durationMinutes < 15) {
                throw new common_1.BadRequestException('Time slots must be at least 15 minutes long');
            }
        }
        for (let i = 0; i < dto.timeSlots.length; i++) {
            for (let j = i + 1; j < dto.timeSlots.length; j++) {
                const slot1Start = new Date(dto.timeSlots[i].startTime);
                const slot1End = new Date(dto.timeSlots[i].endTime);
                const slot2Start = new Date(dto.timeSlots[j].startTime);
                const slot2End = new Date(dto.timeSlots[j].endTime);
                if (slot1Start < slot2End && slot2Start < slot1End) {
                    throw new common_1.BadRequestException(`Time slots cannot overlap: ${dto.timeSlots[i].startTime} - ${dto.timeSlots[i].endTime} overlaps with ${dto.timeSlots[j].startTime} - ${dto.timeSlots[j].endTime}`);
                }
            }
        }
        const existingSlots = await this.prisma.timeSlot.findMany({
            where: {
                doctorId,
                deletedAt: null,
            },
            include: {
                appointments: {
                    where: {
                        status: client_1.AppointmentStatus.BOOKED,
                    },
                },
            },
        });
        const newSlotTimes = dto.timeSlots.map((s) => ({
            start: new Date(s.startTime).toISOString(),
            end: new Date(s.endTime).toISOString(),
        }));
        for (const existingSlot of existingSlots) {
            const hasActiveAppointment = existingSlot.appointments.length > 0;
            const isInNewSchedule = newSlotTimes.some((newSlot) => newSlot.start === existingSlot.startTime.toISOString() &&
                newSlot.end === existingSlot.endTime.toISOString());
            if (hasActiveAppointment && !isInNewSchedule) {
                throw new common_1.ConflictException(`Cannot delete slot with active appointment. Slot: ${existingSlot.startTime.toISOString()}`);
            }
        }
        const slotsToKeep = [];
        const slotsToCreate = [];
        const slotsToDelete = [];
        for (const newSlot of dto.timeSlots) {
            const newStart = new Date(newSlot.startTime).toISOString();
            const newEnd = new Date(newSlot.endTime).toISOString();
            const matchingExisting = existingSlots.find((existing) => existing.startTime.toISOString() === newStart &&
                existing.endTime.toISOString() === newEnd);
            if (matchingExisting) {
                slotsToKeep.push(matchingExisting);
            }
            else {
                slotsToCreate.push(newSlot);
            }
        }
        for (const existingSlot of existingSlots) {
            const hasActiveAppointment = existingSlot.appointments.length > 0;
            const isInNewSchedule = newSlotTimes.some((newSlot) => newSlot.start === existingSlot.startTime.toISOString() &&
                newSlot.end === existingSlot.endTime.toISOString());
            if (!isInNewSchedule && !hasActiveAppointment) {
                slotsToDelete.push(existingSlot);
            }
        }
        const createdSlots = await Promise.all(slotsToCreate.map((slot) => this.prisma.timeSlot.create({
            data: {
                startTime: new Date(slot.startTime),
                endTime: new Date(slot.endTime),
                doctorId,
            },
        })));
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
};
exports.DoctorsService = DoctorsService;
exports.DoctorsService = DoctorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DoctorsService);
//# sourceMappingURL=doctors.service.js.map