"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorDetailResponseDto = exports.ListDoctorsResponseDto = exports.PaginationDto = exports.DoctorDto = exports.DoctorProfileDto = void 0;
class DoctorProfileDto {
    specialty;
    shortDescription;
}
exports.DoctorProfileDto = DoctorProfileDto;
class DoctorDto {
    id;
    name;
    email;
    address;
    profile;
    createdAt;
    updatedAt;
}
exports.DoctorDto = DoctorDto;
class PaginationDto {
    page;
    limit;
    total;
    totalPages;
}
exports.PaginationDto = PaginationDto;
class ListDoctorsResponseDto {
    success;
    data;
    pagination;
}
exports.ListDoctorsResponseDto = ListDoctorsResponseDto;
class DoctorDetailResponseDto {
    success;
    data;
}
exports.DoctorDetailResponseDto = DoctorDetailResponseDto;
//# sourceMappingURL=doctor-response.dto.js.map