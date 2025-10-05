"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelAppointmentResponseDto = exports.SingleAppointmentResponseDto = exports.ListAppointmentsResponseDto = exports.AppointmentResponseDto = exports.AppointmentBookedByDto = exports.AppointmentPatientDto = exports.AppointmentDoctorDto = exports.AppointmentSlotDto = void 0;
class AppointmentSlotDto {
    id;
    startTime;
    endTime;
}
exports.AppointmentSlotDto = AppointmentSlotDto;
class AppointmentDoctorDto {
    id;
    name;
    specialty;
}
exports.AppointmentDoctorDto = AppointmentDoctorDto;
class AppointmentPatientDto {
    id;
    name;
}
exports.AppointmentPatientDto = AppointmentPatientDto;
class AppointmentBookedByDto {
    id;
    name;
}
exports.AppointmentBookedByDto = AppointmentBookedByDto;
class AppointmentResponseDto {
    id;
    status;
    notes;
    slot;
    doctor;
    patient;
    bookedBy;
    createdAt;
    updatedAt;
}
exports.AppointmentResponseDto = AppointmentResponseDto;
class ListAppointmentsResponseDto {
    success;
    data;
    pagination;
}
exports.ListAppointmentsResponseDto = ListAppointmentsResponseDto;
class SingleAppointmentResponseDto {
    success;
    data;
}
exports.SingleAppointmentResponseDto = SingleAppointmentResponseDto;
class CancelAppointmentResponseDto {
    success;
    message;
    data;
}
exports.CancelAppointmentResponseDto = CancelAppointmentResponseDto;
//# sourceMappingURL=appointment-response.dto.js.map