import { AppointmentStatus } from '@prisma/client';

export class AppointmentSlotDto {
  id: string;
  startTime: Date;
  endTime: Date;
}

export class AppointmentDoctorDto {
  id: string;
  name: string;
  specialty: string;
}

export class AppointmentPatientDto {
  id: string;
  name: string;
}

export class AppointmentBookedByDto {
  id: string;
  name: string;
}

export class AppointmentResponseDto {
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

export class ListAppointmentsResponseDto {
  success: boolean;
  data: AppointmentResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class SingleAppointmentResponseDto {
  success: boolean;
  data: AppointmentResponseDto;
}

export class CancelAppointmentResponseDto {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: AppointmentStatus;
    cancelledAt: Date;
  };
}
