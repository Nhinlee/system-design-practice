export declare class TimeSlotResponseDto {
    id: string;
    startTime: Date;
    endTime: Date;
    isBooked: boolean;
}
export declare class AvailabilitySummaryDto {
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
}
export declare class AvailabilityResponseDto {
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
export declare class UpdateScheduleResponseDto {
    success: boolean;
    data: {
        created: number;
        updated: number;
        deleted: number;
        timeSlots: TimeSlotResponseDto[];
    };
    message: string;
}
