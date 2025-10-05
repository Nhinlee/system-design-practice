"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const faker_1 = require("@faker-js/faker");
const prisma = new client_1.PrismaClient();
faker_1.faker.seed(12345);
async function main() {
    console.log('🌱 Starting database seeding...\n');
    console.log('🧹 Cleaning existing data...');
    await prisma.appointment.deleteMany();
    await prisma.timeSlot.deleteMany();
    await prisma.patientProfile.deleteMany();
    await prisma.doctorProfile.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ Cleaned existing data\n');
    console.log('👤 Creating admin user...');
    const admin = await prisma.user.create({
        data: {
            id: 'admin-seed-001',
            email: 'admin@clinic.com',
            name: 'System Administrator',
            role: client_1.UserRole.ADMIN,
            address: '1 Admin Plaza, Suite 100',
        },
    });
    console.log(`✅ Created admin: ${admin.email}\n`);
    console.log('👨‍⚕️ Creating doctors...');
    const specialties = [
        'Cardiology',
        'Dermatology',
        'Orthopedics',
        'Pediatrics',
        'Neurology',
    ];
    const doctors = [];
    for (let i = 0; i < 5; i++) {
        const doctorUser = await prisma.user.create({
            data: {
                id: `doctor-seed-${String(i + 1).padStart(3, '0')}`,
                email: `dr.${faker_1.faker.person.lastName().toLowerCase()}@clinic.com`,
                name: `Dr. ${faker_1.faker.person.firstName()} ${faker_1.faker.person.lastName()}`,
                role: client_1.UserRole.DOCTOR,
                address: faker_1.faker.location.streetAddress(),
            },
        });
        const doctorProfile = await prisma.doctorProfile.create({
            data: {
                id: `profile-seed-${String(i + 1).padStart(3, '0')}`,
                userId: doctorUser.id,
                specialty: specialties[i],
                shortDescription: `${specialties[i]} specialist with ${faker_1.faker.number.int({ min: 5, max: 20 })} years of experience`,
            },
        });
        doctors.push({ user: doctorUser, profile: doctorProfile });
        console.log(`  ✓ Created: ${doctorUser.name} (${specialties[i]})`);
    }
    console.log(`✅ Created ${doctors.length} doctors\n`);
    console.log('👥 Creating patients...');
    const patients = [];
    for (let i = 0; i < 20; i++) {
        const patientUser = await prisma.user.create({
            data: {
                id: `patient-seed-${String(i + 1).padStart(3, '0')}`,
                email: `${faker_1.faker.internet.username()}@example.com`,
                name: `${faker_1.faker.person.firstName()} ${faker_1.faker.person.lastName()}`,
                role: client_1.UserRole.PATIENT,
                address: faker_1.faker.location.streetAddress(),
            },
        });
        const patientProfile = await prisma.patientProfile.create({
            data: {
                id: `patient-profile-${String(i + 1).padStart(3, '0')}`,
                userId: patientUser.id,
                dateOfBirth: faker_1.faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
                address: faker_1.faker.location.streetAddress(),
            },
        });
        patients.push({ user: patientUser, profile: patientProfile });
    }
    console.log(`✅ Created ${patients.length} patients\n`);
    console.log('📅 Creating time slots...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let totalSlots = 0;
    const allSlots = [];
    for (const doctor of doctors) {
        for (let day = 0; day < 14; day++) {
            const slotDate = new Date(today);
            slotDate.setDate(slotDate.getDate() + day);
            if (slotDate.getDay() === 0 || slotDate.getDay() === 6) {
                continue;
            }
            for (let hour = 9; hour < 17; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const slotStart = new Date(slotDate);
                    slotStart.setHours(hour, minute, 0, 0);
                    const slotEnd = new Date(slotStart);
                    slotEnd.setMinutes(slotEnd.getMinutes() + 30);
                    const slot = await prisma.timeSlot.create({
                        data: {
                            id: `slot-${doctor.user.id}-${day}-${hour}-${minute}`,
                            doctorId: doctor.user.id,
                            startTime: slotStart,
                            endTime: slotEnd,
                        },
                    });
                    totalSlots++;
                    allSlots.push({ slot, doctorId: doctor.user.id });
                }
            }
        }
        console.log(`  ✓ Created slots for ${doctor.user.name}`);
    }
    console.log(`✅ Created ${totalSlots} time slots\n`);
    console.log('📋 Creating sample appointments...');
    const appointmentCount = Math.floor(totalSlots * 0.3);
    const shuffledSlots = allSlots.sort(() => Math.random() - 0.5);
    let bookedCount = 0;
    let cancelledCount = 0;
    for (let i = 0; i < appointmentCount && i < shuffledSlots.length; i++) {
        const { slot } = shuffledSlots[i];
        const randomPatient = patients[Math.floor(Math.random() * patients.length)];
        const isCancelled = Math.random() < 0.1;
        const status = isCancelled
            ? client_1.AppointmentStatus.CANCELLED
            : client_1.AppointmentStatus.BOOKED;
        await prisma.appointment.create({
            data: {
                id: `appointment-seed-${String(i + 1).padStart(3, '0')}`,
                slotId: slot.id,
                patientId: randomPatient.user.id,
                bookedByUserId: randomPatient.user.id,
                status,
                notes: faker_1.faker.lorem.sentence(),
                idempotencyKey: faker_1.faker.string.uuid(),
            },
        });
        if (!isCancelled) {
            bookedCount++;
        }
        else {
            cancelledCount++;
        }
    }
    console.log(`✅ Created ${appointmentCount} appointments`);
    console.log(`   - ${bookedCount} active bookings`);
    console.log(`   - ${cancelledCount} cancelled\n`);
    console.log('📊 Seeding Summary:');
    console.log('==================');
    console.log(`👤 Admin users: 1`);
    console.log(`👨‍⚕️ Doctors: ${doctors.length}`);
    console.log(`👥 Patients: ${patients.length}`);
    console.log(`📅 Time slots: ${totalSlots}`);
    console.log(`📋 Appointments: ${appointmentCount}`);
    console.log(`   └─ Booked: ${bookedCount}`);
    console.log(`   └─ Cancelled: ${cancelledCount}`);
    console.log(`   └─ Available slots: ${totalSlots - bookedCount}`);
    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('🔑 Useful Test IDs:');
    console.log('==================');
    console.log(`Admin: ${admin.id}`);
    console.log(`First Doctor: ${doctors[0].user.id}`);
    console.log(`First Patient: ${patients[0].user.id}`);
    console.log(`Available Slot: ${allSlots.find((s) => shuffledSlots.slice(appointmentCount).includes(s))?.slot.id || 'Check database'}`);
    console.log('');
}
main()
    .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
})
    .finally(() => {
    void prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map