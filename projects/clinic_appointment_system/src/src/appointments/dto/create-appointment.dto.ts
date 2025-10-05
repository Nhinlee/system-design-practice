import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  slotId: string;

  @IsUUID()
  patientId: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
