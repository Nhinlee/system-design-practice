import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, ListAppointmentsQueryDto } from './dto';
import { UserRole } from '@prisma/client';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Create a new appointment
   * POST /appointments
   */
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createAppointment(
    @Body() dto: CreateAppointmentDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    // TODO: Get actual user ID from JWT token
    // For now, we'll use the patient ID as the bookedBy user
    const bookedByUserId = dto.patientId;

    return this.appointmentsService.createAppointment(
      dto,
      bookedByUserId,
      idempotencyKey,
    );
  }

  /**
   * List appointments with role-based filtering
   * GET /appointments
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async listAppointments(@Query() query: ListAppointmentsQueryDto) {
    // TODO: Get actual user ID and role from JWT token
    // For now, return all appointments (admin view)
    const currentUserId = 'temp-admin-id';
    const currentUserRole = UserRole.ADMIN;

    return this.appointmentsService.listAppointments(
      query,
      currentUserId,
      currentUserRole,
    );
  }

  /**
   * Get specific appointment
   * GET /appointments/:id
   */
  @Get(':id')
  async getAppointment(@Param('id') id: string) {
    // TODO: Get actual user ID and role from JWT token
    const currentUserId = 'temp-admin-id';
    const currentUserRole = UserRole.ADMIN;

    return this.appointmentsService.getAppointmentById(
      id,
      currentUserId,
      currentUserRole,
    );
  }

  /**
   * Cancel an appointment
   * DELETE /appointments/:id
   */
  @Delete(':id')
  async cancelAppointment(@Param('id') id: string) {
    // TODO: Get actual user ID and role from JWT token
    const currentUserId = 'temp-admin-id';
    const currentUserRole = UserRole.ADMIN;

    return this.appointmentsService.cancelAppointment(
      id,
      currentUserId,
      currentUserRole,
    );
  }
}
