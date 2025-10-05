import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, ListAppointmentsQueryDto } from './dto';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    createAppointment(dto: CreateAppointmentDto, idempotencyKey?: string): Promise<{
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
    listAppointments(query: ListAppointmentsQueryDto): Promise<{
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
    getAppointment(id: string): Promise<{
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
    cancelAppointment(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            status: import("@prisma/client").$Enums.AppointmentStatus;
            cancelledAt: Date;
        };
    }>;
}
