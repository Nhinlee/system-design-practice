import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  ValidationPipe,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { ListDoctorsQueryDto } from './dto/list-doctors-query.dto';
import { GetAvailabilityQueryDto } from './dto/get-availability-query.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  /**
   * GET /doctors
   * List all doctors with optional filtering and pagination
   */
  @Get()
  async listDoctors(@Query(ValidationPipe) query: ListDoctorsQueryDto) {
    return this.doctorsService.listDoctors(query);
  }

  /**
   * GET /doctors/:id
   * Get detailed information about a specific doctor
   */
  @Get(':id')
  async getDoctorById(@Param('id') id: string) {
    return this.doctorsService.getDoctorById(id);
  }

  /**
   * GET /doctors/:id/availability
   * Check doctor's available time slots within a date range
   */
  @Get(':id/availability')
  async getAvailability(
    @Param('id') doctorId: string,
    @Query(ValidationPipe) query: GetAvailabilityQueryDto,
  ) {
    return this.doctorsService.getAvailability(doctorId, query);
  }

  /**
   * PUT /doctors/:id/schedule
   * Update doctor's schedule
   * TODO: Add authentication guard
   * TODO: Extract current user ID from JWT token
   */
  @Put(':id/schedule')
  async updateSchedule(
    @Param('id') doctorId: string,
    @Body(ValidationPipe) dto: UpdateScheduleDto,
  ) {
    // TODO: Replace with actual authenticated user ID from JWT
    const currentUserId = doctorId; // Temporary: using doctorId as currentUserId

    return this.doctorsService.updateSchedule(doctorId, currentUserId, dto);
  }
}
