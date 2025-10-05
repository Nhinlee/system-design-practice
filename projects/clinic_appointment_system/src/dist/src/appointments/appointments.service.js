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
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let AppointmentsService = class AppointmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAppointment(dto, bookedByUserId, idempotencyKey) {
        if (idempotencyKey) {
            const existingAppointment = await this.prisma.appointment.findFirst({
                where: {
                    idempotencyKey,
                    status: client_1.AppointmentStatus.BOOKED,
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
                return {
                    success: true,
                    data: this.transformAppointment(existingAppointment),
                    message: 'Appointment already exists (idempotent)',
                };
            }
        }
        const slot = await this.prisma.timeSlot.findUnique({
            where: { id: dto.slotId },
            include: {
                appointments: {
                    where: {
                        status: client_1.AppointmentStatus.BOOKED,
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
            throw new common_1.NotFoundException('Time slot not found');
        }
        if (slot.deletedAt) {
            throw new common_1.BadRequestException('Time slot is no longer available');
        }
        if (slot.startTime < new Date()) {
            throw new common_1.BadRequestException('Cannot book appointments in the past');
        }
        if (slot.appointments.length > 0) {
            throw new common_1.ConflictException('This time slot is already booked. Please select another time.');
        }
        const patient = await this.prisma.user.findUnique({
            where: { id: dto.patientId },
        });
        if (!patient || patient.role !== client_1.UserRole.PATIENT) {
            throw new common_1.NotFoundException('Patient not found');
        }
        const bookedBy = await this.prisma.user.findUnique({
            where: { id: bookedByUserId },
        });
        if (!bookedBy) {
            throw new common_1.NotFoundException('User not found');
        }
        const appointment = await this.prisma.appointment.create({
            data: {
                slotId: dto.slotId,
                patientId: dto.patientId,
                bookedByUserId: bookedByUserId,
                status: client_1.AppointmentStatus.BOOKED,
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
    async listAppointments(query, currentUserId, currentUserRole) {
        const { page = 1, limit = 20, status, startDate, endDate, doctorId, patientId, } = query;
        const skip = (page - 1) * limit;
        const where = {};
        if (currentUserRole === client_1.UserRole.PATIENT) {
            where.patientId = currentUserId;
            if (doctorId) {
                where.slot = {
                    doctorId,
                };
            }
        }
        else if (currentUserRole === client_1.UserRole.DOCTOR) {
            where.slot = {
                doctorId: currentUserId,
            };
            if (patientId) {
                where.patientId = patientId;
            }
        }
        else {
            if (doctorId) {
                where.slot = {
                    doctorId,
                };
            }
            if (patientId) {
                where.patientId = patientId;
            }
        }
        if (status) {
            where.status = status;
        }
        if (startDate || endDate) {
            where.slot = {
                ...where.slot,
            };
            if (startDate && endDate) {
                where.slot.startTime = {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                };
            }
            else if (startDate) {
                where.slot.startTime = {
                    gte: new Date(startDate),
                };
            }
            else if (endDate) {
                where.slot.startTime = {
                    lte: new Date(endDate),
                };
            }
        }
        const total = await this.prisma.appointment.count({ where });
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
    async getAppointmentById(id, currentUserId, currentUserRole) {
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
            throw new common_1.NotFoundException('Appointment not found');
        }
        const isPatient = currentUserRole === client_1.UserRole.PATIENT &&
            appointment.patientId === currentUserId;
        const isDoctor = currentUserRole === client_1.UserRole.DOCTOR &&
            appointment.slot.doctorId === currentUserId;
        const isAdmin = currentUserRole === client_1.UserRole.ADMIN;
        if (!isPatient && !isDoctor && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to view this appointment');
        }
        return {
            success: true,
            data: this.transformAppointment(appointment),
        };
    }
    async cancelAppointment(id, currentUserId, currentUserRole) {
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
            throw new common_1.NotFoundException('Appointment not found');
        }
        if (appointment.status === client_1.AppointmentStatus.CANCELLED) {
            throw new common_1.BadRequestException('Appointment is already cancelled');
        }
        if (appointment.status === client_1.AppointmentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Cannot cancel a completed appointment');
        }
        const isPatient = currentUserRole === client_1.UserRole.PATIENT &&
            appointment.patientId === currentUserId;
        const isDoctor = currentUserRole === client_1.UserRole.DOCTOR &&
            appointment.slot.doctorId === currentUserId;
        const isAdmin = currentUserRole === client_1.UserRole.ADMIN;
        if (!isPatient && !isDoctor && !isAdmin) {
            throw new common_1.ForbiddenException('You do not have permission to cancel this appointment');
        }
        if (appointment.slot.startTime < new Date()) {
            throw new common_1.BadRequestException('Cannot cancel appointments in the past');
        }
        const cancelled = await this.prisma.appointment.update({
            where: { id },
            data: {
                status: client_1.AppointmentStatus.CANCELLED,
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
    transformAppointment(appointment) {
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
                specialty: appointment.slot.doctor.doctorProfile?.specialty || 'General',
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
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map