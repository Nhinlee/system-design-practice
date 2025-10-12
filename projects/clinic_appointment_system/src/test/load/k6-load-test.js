/**
 * k6 Full Load Test
 * Comprehensive 8-minute load test with multiple phases
 * 
 * Run: k6 run --out json=test/load/results/k6-load-test.json test/load/k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Custom metrics
const errorRate = new Rate('errors');
const bookingSuccessRate = new Rate('booking_success');
const bookingConflictRate = new Rate('booking_conflicts');
const responseTimeTrend = new Trend('custom_response_time');
const totalRequests = new Counter('total_requests');

// Test configuration with multiple phases
export const options = {
  stages: [
    // Phase 1: Warm-up
    { duration: '1m', target: 5 },      // Ramp up to 5 VUs over 1 minute
    
    // Phase 2: Ramp-up
    { duration: '2m', target: 50 },     // Ramp up to 50 VUs over 2 minutes
    
    // Phase 3: Peak load (sustained)
    { duration: '3m', target: 50 },     // Stay at 50 VUs for 3 minutes
    
    // Phase 4: Spike test
    { duration: '1m', target: 100 },    // Spike to 100 VUs for 1 minute
    
    // Phase 5: Cool down
    { duration: '1m', target: 20 },     // Ramp down to 20 VUs over 1 minute
  ],
  
  // Thresholds (Production SLA)
  thresholds: {
    http_req_failed: ['rate<0.01'],              // Error rate < 1%
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // P95 < 2s, P99 < 5s
    'http_req_duration{scenario:booking}': ['p(95)<500'], // Booking P95 < 500ms
    errors: ['rate<0.01'],
    booking_success: ['rate>0.80'],              // At least 80% bookings succeed
  },
  
  // Tags
  tags: {
    test_type: 'load',
    environment: 'local',
  },
};

const BASE_URL = 'http://localhost:3000';

// Test data
const DOCTOR_IDS = ['doctor-seed-001', 'doctor-seed-002', 'doctor-seed-003', 'doctor-seed-004', 'doctor-seed-005'];
const PATIENT_IDS = Array.from({ length: 20 }, (_, i) => `patient-seed-${String(i + 1).padStart(3, '0')}`);
const AVAILABLE_SLOTS = [
  'slot-doctor-seed-001-2-9-0',
  'slot-doctor-seed-001-2-9-30',
  'slot-doctor-seed-001-2-10-0',
  'slot-doctor-seed-001-3-9-0',
  'slot-doctor-seed-001-3-10-0',
  'slot-doctor-seed-001-4-10-0',
  'slot-doctor-seed-001-4-15-30',
  'slot-doctor-seed-001-5-9-0',
  'slot-doctor-seed-001-5-15-0',
  'slot-doctor-seed-001-8-9-0',
];

// Weighted scenario selection
function selectScenario() {
  const rand = Math.random() * 100;
  
  if (rand < 60) return 'patient_booking';      // 60%
  if (rand < 85) return 'view_appointments';    // 25%
  if (rand < 95) return 'doctor_schedule';      // 10%
  return 'concurrent_booking';                  // 5%
}

export default function () {
  totalRequests.add(1);
  const scenario = selectScenario();
  
  switch (scenario) {
    case 'patient_booking':
      patientBookingFlow();
      break;
    case 'view_appointments':
      viewAppointments();
      break;
    case 'doctor_schedule':
      doctorSchedule();
      break;
    case 'concurrent_booking':
      concurrentBooking();
      break;
  }
  
  sleep(randomIntBetween(1, 3)); // Random think time 1-3 seconds
}

// Scenario 1: Patient Booking Flow (60%)
function patientBookingFlow() {
  group('Patient Booking Flow', function () {
    // Step 1: Browse doctors
    const browseDoctors = http.get(`${BASE_URL}/doctors?specialty=Cardiology&page=1&limit=10`, {
      tags: { scenario: 'booking', step: 'browse' },
    });
    
    check(browseDoctors, {
      'browse doctors - status 200': (r) => r.status === 200,
      'browse doctors - has data': (r) => JSON.parse(r.body).data !== undefined,
    });
    
    sleep(1); // User reviews doctors
    
    // Step 2: Check availability
    const doctorId = randomItem(DOCTOR_IDS);
    const availability = http.get(
      `${BASE_URL}/doctors/${doctorId}/availability?start_date=2025-10-07&end_date=2025-10-14`,
      { tags: { scenario: 'booking', step: 'availability' } }
    );
    
    check(availability, {
      'check availability - status 200': (r) => r.status === 200,
    });
    
    sleep(2); // User selects slot
    
    // Step 3: Book appointment
    const slotId = randomItem(AVAILABLE_SLOTS);
    const patientId = randomItem(PATIENT_IDS);
    const idempotencyKey = `booking-${Date.now()}-${randomIntBetween(1, 999999)}`;
    
    const booking = http.post(
      `${BASE_URL}/appointments`,
      JSON.stringify({
        slotId: slotId,
        patientId: patientId,
        notes: 'Load test booking',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        tags: { scenario: 'booking', step: 'book' },
      }
    );
    
    const bookingSuccess = check(booking, {
      'booking - status 201 or 409': (r) => r.status === 201 || r.status === 409,
      'booking - is successful': (r) => r.status === 201,
    });
    
    bookingSuccessRate.add(booking.status === 201);
    bookingConflictRate.add(booking.status === 409);
    errorRate.add(!bookingSuccess);
    responseTimeTrend.add(booking.timings.duration);
    
    // Step 4: View appointment details (if successful)
    if (booking.status === 201) {
      const appointmentData = JSON.parse(booking.body);
      const appointmentId = appointmentData.data?.id;
      
      if (appointmentId) {
        const details = http.get(`${BASE_URL}/appointments/${appointmentId}`, {
          tags: { scenario: 'booking', step: 'view_details' },
        });
        
        check(details, {
          'view details - status 200': (r) => r.status === 200,
        });
      }
    }
  });
}

// Scenario 2: View Appointments (25%)
function viewAppointments() {
  group('View My Appointments', function () {
    const response = http.get(`${BASE_URL}/appointments?status=BOOKED&page=1&limit=20`, {
      tags: { scenario: 'view', step: 'list' },
    });
    
    const success = check(response, {
      'view appointments - status 200': (r) => r.status === 200,
      'view appointments - is JSON': (r) => r.headers['Content-Type'].includes('application/json'),
    });
    
    errorRate.add(!success);
  });
}

// Scenario 3: Doctor Schedule (10%)
function doctorSchedule() {
  group('Doctor Views Schedule', function () {
    const doctorId = randomItem(DOCTOR_IDS);
    
    // Get doctor's appointments
    const appointments = http.get(`${BASE_URL}/appointments?doctorId=${doctorId}&status=BOOKED`, {
      tags: { scenario: 'doctor', step: 'appointments' },
    });
    
    check(appointments, {
      'doctor appointments - status 200': (r) => r.status === 200,
    });
    
    sleep(1);
    
    // Get availability
    const availability = http.get(
      `${BASE_URL}/doctors/${doctorId}/availability?start_date=2025-10-07&end_date=2025-10-14`,
      { tags: { scenario: 'doctor', step: 'availability' } }
    );
    
    const success = check(availability, {
      'doctor availability - status 200': (r) => r.status === 200,
    });
    
    errorRate.add(!success);
  });
}

// Scenario 4: Concurrent Booking (5% - Race condition test)
function concurrentBooking() {
  group('Concurrent Slot Booking', function () {
    // Multiple users try to book the same slot
    const slotId = 'slot-doctor-seed-001-2-10-0'; // Same slot for all
    const patientId = randomItem(PATIENT_IDS);
    const idempotencyKey = `race-${Date.now()}-${randomIntBetween(1, 999999)}`;
    
    const booking = http.post(
      `${BASE_URL}/appointments`,
      JSON.stringify({
        slotId: slotId,
        patientId: patientId,
        notes: 'Concurrent booking test',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        tags: { scenario: 'race', step: 'book' },
      }
    );
    
    // One should succeed (201), others should conflict (409)
    const success = check(booking, {
      'race booking - status 201 or 409': (r) => r.status === 201 || r.status === 409,
    });
    
    errorRate.add(!success);
  });
}

// Setup function
export function setup() {
  console.log('🔥 Starting Full Load Test...');
  console.log('⏱️  Duration: 8 minutes');
  console.log('👥 Peak Virtual Users: 100');
  console.log('🎯 Target: ' + BASE_URL);
  console.log('\n📊 Phases:');
  console.log('  1. Warm-up:      1 min  →  5 VUs');
  console.log('  2. Ramp-up:      2 min  → 50 VUs');
  console.log('  3. Peak:         3 min  @ 50 VUs');
  console.log('  4. Spike:        1 min  → 100 VUs');
  console.log('  5. Cool-down:    1 min  → 20 VUs');
  console.log('\n🎯 Scenarios:');
  console.log('  - Patient Booking Flow:     60%');
  console.log('  - View My Appointments:     25%');
  console.log('  - Doctor Views Schedule:    10%');
  console.log('  - Concurrent Slot Booking:   5%');
  console.log('\n✅ Thresholds:');
  console.log('  - Error Rate:    < 1%');
  console.log('  - P95 Latency:   < 2s');
  console.log('  - P99 Latency:   < 5s');
  console.log('  - Booking P95:   < 500ms');
  console.log('');
}

// Teardown function
export function teardown(data) {
  console.log('\n✅ Full load test completed!');
}

// Handle summary
export function handleSummary(data) {
  console.log('\n📊 Test Summary:');
  console.log('════════════════════════════════════════════════');
  console.log(`Total Requests:    ${data.metrics.total_requests.values.count}`);
  console.log(`Total VUs:         ${data.metrics.vus_max.values.value}`);
  console.log(`Duration:          ${(data.state.testRunDurationMs / 1000).toFixed(0)}s`);
  console.log('');
  console.log(`HTTP Success Rate: ${((1 - data.metrics.http_req_failed.values.rate) * 100).toFixed(2)}%`);
  console.log(`Error Rate:        ${(data.metrics.errors.values.rate * 100).toFixed(2)}%`);
  console.log(`Booking Success:   ${(data.metrics.booking_success.values.rate * 100).toFixed(2)}%`);
  console.log(`Booking Conflicts: ${(data.metrics.booking_conflicts.values.rate * 100).toFixed(2)}%`);
  console.log('');
  console.log('Response Times:');
  console.log(`  Min:     ${data.metrics.http_req_duration.values.min.toFixed(2)}ms`);
  console.log(`  Median:  ${data.metrics.http_req_duration.values.med.toFixed(2)}ms`);
  console.log(`  P90:     ${data.metrics.http_req_duration.values['p(90)'].toFixed(2)}ms`);
  console.log(`  P95:     ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`  P99:     ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
  console.log(`  Max:     ${data.metrics.http_req_duration.values.max.toFixed(2)}ms`);
  console.log('════════════════════════════════════════════════');
  
  return {
    'test/load/results/k6-load-test.html': htmlReport(data),
    'test/load/results/k6-load-test.json': JSON.stringify(data, null, 2),
    stdout: '', // Don't duplicate to stdout
  };
}
