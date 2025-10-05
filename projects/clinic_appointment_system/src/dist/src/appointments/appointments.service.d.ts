import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto, ListAppointmentsQueryDto } from './dto';
import { UserRole } from '@prisma/client';
export declare class AppointmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    createAppointment(dto: CreateAppointmentDto, bookedByUserId: string, idempotencyKey?: string): Promise<{
        success: boolean;
        data: {
            id: any;
            status: any;
            notes: any;
            slot: {
                id: any;
                startTime: any;
                endTime: any;
            };
            doctor: {
                id: any;
                name: any;
                specialty: any;
            };
            patient: {
                id: any;
                name: any;
            };
            bookedBy: {
                id: any;
                name: any;
            };
            createdAt: any;
            updatedAt: any;
        };
        message: string;
    }>;
    listAppointments(query: ListAppointmentsQueryDto, currentUserId: string, currentUserRole: UserRole): Promise<{
        success: boolean;
        data: {
            id: any;
            status: any;
            notes: any;
            slot: {
                id: any;
                startTime: any;
                endTime: any;
            };
            doctor: {
                id: any;
                name: any;
                specialty: any;
            };
            patient: {
                id: any;
                name: any;
            };
            bookedBy: {
                id: any;
                name: any;
            };
            createdAt: any;
            updatedAt: any;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getAppointmentById(id: string, currentUserId: string, currentUserRole: UserRole): Promise<{
        success: boolean;
        data: {
            id: any;
            status: any;
            notes: any;
            slot: {
                id: any;
                startTime: any;
                endTime: any;
            };
            doctor: {
                id: any;
                name: any;
                specialty: any;
            };
            patient: {
                id: any;
                name: any;
            };
            bookedBy: {
                id: any;
                name: any;
            };
            createdAt: any;
            updatedAt: any;
        };
    }>;
    cancelAppointment(id: string, currentUserId: string, currentUserRole: UserRole): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            cancelledAt: Date;
        };
    }>;
    private transformAppointment;
}
