export declare class DoctorProfileDto {
    specialty: string;
    shortDescription?: string;
}
export declare class DoctorDto {
    id: string;
    name: string;
    email: string;
    address?: string;
    profile?: DoctorProfileDto;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare class PaginationDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export declare class ListDoctorsResponseDto {
    success: boolean;
    data: DoctorDto[];
    pagination: PaginationDto;
}
export declare class DoctorDetailResponseDto {
    success: boolean;
    data: DoctorDto;
}
