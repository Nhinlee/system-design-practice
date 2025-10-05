import { PrismaService } from '../prisma/prisma.service';
import { ListDoctorsQueryDto } from './dto/list-doctors-query.dto';
import { GetAvailabilityQueryDto } from './dto/get-availability-query.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
export declare class DoctorsService {
    private prisma;
    constructor(prisma: PrismaService);
    listDoctors(query: ListDoctorsQueryDto): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            email: string;
            address: string | null;
            profile: {
                specialty: string;
                shortDescription: string | null;
            } | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getDoctorById(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            email: string;
            role: "DOCTOR";
            address: string | null;
            profile: {
                id: string;
                specialty: string;
                shortDescription: string | null;
                createdAt: Date;
            } | null;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    getAvailability(doctorId: string, query: GetAvailabilityQueryDto): Promise<{
        success: boolean;
        data: {
            doctorId: string;
            doctorName: string;
            dateRange: {
                startDate: string;
                endDate: string;
            };
            availableSlots: {
                id: string;
                startTime: Date;
                endTime: Date;
                isBooked: boolean;
            }[];
            summary: {
                totalSlots: number;
                availableSlots: number;
                bookedSlots: number;
            };
        };
    }>;
    updateSchedule(doctorId: string, currentUserId: string, dto: UpdateScheduleDto): Promise<{
        success: boolean;
        data: {
            created: number;
            kept: number;
            deleted: number;
            timeSlots: {
                id: string;
                startTime: Date;
                endTime: Date;
                isBooked: boolean;
            }[];
        };
        message: string;
    }>;
}
