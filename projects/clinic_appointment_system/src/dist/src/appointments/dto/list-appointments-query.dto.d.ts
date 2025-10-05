import { AppointmentStatus } from '@prisma/client';
export declare class ListAppointmentsQueryDto {
    page?: number;
    limit?: number;
    status?: AppointmentStatus;
    startDate?: string;
    endDate?: string;
    doctorId?: string;
    patientId?: string;
}
