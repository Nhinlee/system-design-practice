"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateScheduleResponseDto = exports.AvailabilityResponseDto = exports.AvailabilitySummaryDto = exports.TimeSlotResponseDto = void 0;
class TimeSlotResponseDto {
    id;
    startTime;
    endTime;
    isBooked;
}
exports.TimeSlotResponseDto = TimeSlotResponseDto;
class AvailabilitySummaryDto {
    totalSlots;
    availableSlots;
    bookedSlots;
}
exports.AvailabilitySummaryDto = AvailabilitySummaryDto;
class AvailabilityResponseDto {
    success;
    data;
}
exports.AvailabilityResponseDto = AvailabilityResponseDto;
class UpdateScheduleResponseDto {
    success;
    data;
    message;
}
exports.UpdateScheduleResponseDto = UpdateScheduleResponseDto;
//# sourceMappingURL=availability-response.dto.js.map