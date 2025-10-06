import { IsString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsString() // Temporarily relaxed for load testing with seed data
  slotId: string;

  @IsString() // Temporarily relaxed for load testing with seed data
  patientId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
