export class TimeSlotResponseDto {
  id: string;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
}

export class AvailabilitySummaryDto {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
}

export class AvailabilityResponseDto {
  success: boolean;
  data: {
    doctorId: string;
    doctorName: string;
    dateRange: {
      startDate: string;
      endDate: string;
    };
    availableSlots: TimeSlotResponseDto[];
    summary: AvailabilitySummaryDto;
  };
}

export class UpdateScheduleResponseDto {
  success: boolean;
  data: {
    created: number;
    updated: number;
    deleted: number;
    timeSlots: TimeSlotResponseDto[];
  };
  message: string;
}
