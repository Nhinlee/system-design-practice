export class DoctorProfileDto {
  specialty: string;
  shortDescription?: string;
}

export class DoctorDto {
  id: string;
  name: string;
  email: string;
  address?: string;
  profile?: DoctorProfileDto;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PaginationDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class ListDoctorsResponseDto {
  success: boolean;
  data: DoctorDto[];
  pagination: PaginationDto;
}

export class DoctorDetailResponseDto {
  success: boolean;
  data: DoctorDto;
}
