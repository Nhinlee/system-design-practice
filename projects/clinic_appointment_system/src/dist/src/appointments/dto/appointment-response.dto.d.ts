import { AppointmentStatus } from '@prisma/client';
export declare class AppointmentSlotDto {
    id: string;
    startTime: Date;
    endTime: Date;
}
export declare class AppointmentDoctorDto {
    id: string;
    name: string;
    specialty: string;
}
export declare class AppointmentPatientDto {
    id: string;
    name: string;
}
export declare class AppointmentBookedByDto {
    id: string;
    name: string;
}
export declare class AppointmentResponseDto {
    id: string;
    status: AppointmentStatus;
    notes: string | null;
    slot: AppointmentSlotDto;
    doctor: AppointmentDoctorDto;
    patient: AppointmentPatientDto;
    bookedBy: AppointmentBookedByDto;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ListAppointmentsResponseDto {
    success: boolean;
    data: AppointmentResponseDto[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class SingleAppointmentResponseDto {
    success: boolean;
    data: AppointmentResponseDto;
}
export declare class CancelAppointmentResponseDto {
    success: boolean;
    message: string;
    data: {
        id: string;
        status: AppointmentStatus;
        cancelledAt: Date;
    };
}
