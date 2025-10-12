/**
 * k6 Load Test - Appointment Booking System
 * Comprehensive load test with multiple scenarios and phases
 * 
 * Equivalent to: test/load/appointment-booking.yml
 * 
 * Run with: k6 run test/load/k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Custom metrics
const errorRate = new Rate('errors');
const bookingSuccesses = new Counter('booking_successes');
const bookingConflicts = new Counter('booking_conflicts');
const customMetrics = new Trend('custom_duration');

// Test configuration
export const options = {
  // Load test phases (matching Artillery config)
  stages: [
    { duration: '1m', target: 5 },    // Warm up: 1 min at 5 VUs
    { duration: '2m', target: 50 },   // Ramp up: 2 min ramping to 50 VUs
    { duration: '3m', target: 50 },   // Peak load: 3 min sustained at 50 VUs
    { duration: '1m', target: 100 },  // Spike: 1 min at 100 VUs
    { duration: '1m', target: 20 },   // Cool down: 1 min at 20 VUs
  ],
  
  // Thresholds (equivalent to Artillery's ensure)
  thresholds: {
    'http_req_failed': ['rate<0.01'], // Error rate < 1%
    'http_req_duration': [
      'p(95)<2000', // 95th percentile < 2s
      'p(99)<5000', // 99th percentile < 5s
    ],
    'errors': ['rate<0.01'],
  },
  
  // Tag-based execution for weighted scenarios
  scenarios: {
    patient_booking_flow: {
      executor: 'ramping-vus',
      exec: 'patientBookingFlow',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 3 },   // 60% of 5
        { duration: '2m', target: 30 },  // 60% of 50
        { duration: '3m', target: 30 },  // 60% of 50
        { duration: '1m', target: 60 },  // 60% of 100
        { duration: '1m', target: 12 },  // 60% of 20
      ],
    },
    view_appointments: {
      executor: 'ramping-vus',
      exec: 'viewMyAppointments',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 1 },   // 25% of 5
        { duration: '2m', target: 12 },  // 25% of 50
        { duration: '3m', target: 12 },  // 25% of 50
        { duration: '1m', target: 25 },  // 25% of 100
        { duration: '1m', target: 5 },   // 25% of 20
      ],
    },
    doctor_views_schedule: {
      executor: 'ramping-vus',
      exec: 'doctorViewsSchedule',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 1 },   // 10% of 5
        { duration: '2m', target: 5 },   // 10% of 50
        { duration: '3m', target: 5 },   // 10% of 50
        { duration: '1m', target: 10 },  // 10% of 100
        { duration: '1m', target: 2 },   // 10% of 20
      ],
    },
    concurrent_booking: {
      executor: 'ramping-vus',
      exec: 'concurrentSlotBooking',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 1 },   // 5% of 5
        { duration: '2m', target: 3 },   // 5% of 50
        { duration: '3m', target: 3 },   // 5% of 50
        { duration: '1m', target: 5 },   // 5% of 100
        { duration: '1m', target: 1 },   // 5% of 20
      ],
    },
  },
};

const BASE_URL = 'http://localhost:3000';

// Environment variables (matching Artillery config)
const DOCTOR_ID = 'doctor-seed-001';
const PATIENT_ID = 'patient-seed-001';

// Available slots (matching load-test-processor.js)
const AVAILABLE_SLOTS = [
  'slot-doctor-seed-001-2-9-0',
  'slot-doctor-seed-001-2-9-30',
  'slot-doctor-seed-001-2-10-0',
  'slot-doctor-seed-001-2-10-30',
  'slot-doctor-seed-001-3-9-0',
  'slot-doctor-seed-001-3-9-30',
  'slot-doctor-seed-001-3-10-0',
  'slot-doctor-seed-001-3-10-30',
  'slot-doctor-seed-001-4-10-0',
  'slot-doctor-seed-001-4-10-30',
  'slot-doctor-seed-001-4-11-0',
  'slot-doctor-seed-001-4-15-30',
  'slot-doctor-seed-001-4-16-0',
  'slot-doctor-seed-001-5-9-0',
  'slot-doctor-seed-001-5-9-30',
  'slot-doctor-seed-001-5-10-0',
  'slot-doctor-seed-001-5-10-30',
  'slot-doctor-seed-001-5-15-0',
  'slot-doctor-seed-001-5-15-30',
  'slot-doctor-seed-001-5-16-0',
  'slot-doctor-seed-001-8-9-0',
  'slot-doctor-seed-001-8-10-0',
  'slot-doctor-seed-001-8-11-0',
  'slot-doctor-seed-001-8-11-30',
];

// Helper functions
function generateSlotId() {
  return AVAILABLE_SLOTS[Math.floor(Math.random() * AVAILABLE_SLOTS.length)];
}

function generateRandomPatientId() {
  const patientNumber = Math.floor(Math.random() * 20) + 1;
  return `patient-seed-${String(patientNumber).padStart(3, '0')}`;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Scenario 1: Patient Booking Flow (60% weight)
export function patientBookingFlow() {
  // List available doctors
  let response = http.get(
    `${BASE_URL}/doctors?specialty=Cardiology&page=1&limit=10`
  );
  
  let success = check(response, {
    'doctors list status is 200': (r) => r.status === 200,
    'doctors list has JSON content': (r) => r.headers['Content-Type']?.includes('application/json'),
    'doctors list has data property': (r) => {
      try {
        return JSON.parse(r.body).data !== undefined;
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
  
  // Get doctor availability
  response = http.get(
    `${BASE_URL}/doctors/${DOCTOR_ID}/availability?start_date=2025-10-07&end_date=2025-10-14`
  );
  
  success = check(response, {
    'availability status is 200': (r) => r.status === 200,
  });
  
  errorRate.add(!success);
  
  // Think time - user reviews options
  sleep(2);
  
  // Generate random slot ID
  const slotId = generateSlotId();
  const idempotencyKey = generateUUID();
  
  // Book appointment
  response = http.post(
    `${BASE_URL}/appointments`,
    JSON.stringify({
      slotId: slotId,
      patientId: PATIENT_ID,
      notes: 'Annual checkup - Load test',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
  
  success = check(response, {
    'booking status is 201 or 409': (r) => r.status === 201 || r.status === 409,
  });
  
  // Track booking outcomes
  if (response.status === 201) {
    bookingSuccesses.add(1);
  } else if (response.status === 409) {
    bookingConflicts.add(1);
  }
  
  errorRate.add(!success);
  
  // Extract appointment ID if booking succeeded
  let appointmentId = null;
  if (response.status === 201) {
    try {
      const body = JSON.parse(response.body);
      appointmentId = body.data?.id;
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  // Get appointment details if we have an ID
  if (appointmentId) {
    response = http.get(`${BASE_URL}/appointments/${appointmentId}`);
    
    success = check(response, {
      'appointment details status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    
    errorRate.add(!success);
  }
  
  sleep(0.5);
}

// Scenario 2: View My Appointments (25% weight)
export function viewMyAppointments() {
  // List patient's appointments
  const response = http.get(
    `${BASE_URL}/appointments?status=BOOKED&page=1&limit=20`
  );
  
  const success = check(response, {
    'my appointments status is 200': (r) => r.status === 200,
    'my appointments has JSON content': (r) => r.headers['Content-Type']?.includes('application/json'),
  });
  
  errorRate.add(!success);
  
  // Think time
  sleep(1);
}

// Scenario 3: Doctor Views Schedule (10% weight)
export function doctorViewsSchedule() {
  // Get doctor's appointments
  let response = http.get(
    `${BASE_URL}/appointments?doctorId=${DOCTOR_ID}&status=BOOKED`
  );
  
  let success = check(response, {
    'doctor appointments status is 200': (r) => r.status === 200,
  });
  
  errorRate.add(!success);
  
  // Get doctor availability
  response = http.get(
    `${BASE_URL}/doctors/${DOCTOR_ID}/availability?start_date=2025-10-07&end_date=2025-10-14`
  );
  
  success = check(response, {
    'doctor availability status is 200': (r) => r.status === 200,
  });
  
  errorRate.add(!success);
  
  sleep(0.5);
}

// Scenario 4: Concurrent Slot Booking (5% weight)
export function concurrentSlotBooking() {
  // Generate random patient ID for concurrent booking test
  const randomPatientId = generateRandomPatientId();
  const idempotencyKey = generateUUID();
  
  // Multiple users try to book the same slot simultaneously
  const response = http.post(
    `${BASE_URL}/appointments`,
    JSON.stringify({
      slotId: 'slot-doctor-seed-001-2-10-0', // Same slot for race condition test
      patientId: randomPatientId,
      notes: 'Concurrent booking test',
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
  
  const success = check(response, {
    'concurrent booking status is 201 or 409': (r) => r.status === 201 || r.status === 409,
  });
  
  // Track outcomes
  if (response.status === 201) {
    bookingSuccesses.add(1);
  } else if (response.status === 409) {
    bookingConflicts.add(1);
  }
  
  errorRate.add(!success);
  
  sleep(0.3);
}

// Setup function - runs once at the start
export function setup() {
  console.log('🚀 Starting comprehensive load test...');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log('📊 Test Phases:');
  console.log('  - Warm up: 1m @ 5 VUs');
  console.log('  - Ramp up: 2m ramping to 50 VUs');
  console.log('  - Peak load: 3m @ 50 VUs');
  console.log('  - Spike: 1m @ 100 VUs');
  console.log('  - Cool down: 1m @ 20 VUs');
  console.log('📝 Scenarios:');
  console.log('  - Patient Booking Flow: 60%');
  console.log('  - View Appointments: 25%');
  console.log('  - Doctor Views Schedule: 10%');
  console.log('  - Concurrent Booking: 5%');
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log('✅ Load test completed!');
}

// Custom summary handler for better reporting
export function handleSummary(data) {
  // Custom console output
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const metrics = data.metrics;
  
  // HTTP metrics
  if (metrics.http_reqs) {
    console.log(`\n🔢 Total Requests: ${metrics.http_reqs.values.count}`);
  }
  
  if (metrics.http_req_duration) {
    console.log(`\n⏱️  Response Times:`);
    console.log(`  - Average: ${metrics.http_req_duration.values.avg.toFixed(2)}ms`);
    console.log(`  - Median:  ${metrics.http_req_duration.values.med.toFixed(2)}ms`);
    console.log(`  - P95:     ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
    console.log(`  - P99:     ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms`);
    console.log(`  - Max:     ${metrics.http_req_duration.values.max.toFixed(2)}ms`);
  }
  
  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    console.log(`\n❌ Failed Requests: ${failRate}%`);
  }
  
  // Custom business metrics
  if (metrics.booking_successes) {
    console.log(`\n✅ Booking Successes: ${metrics.booking_successes.values.count}`);
  }
  
  if (metrics.booking_conflicts) {
    console.log(`⚠️  Booking Conflicts (409): ${metrics.booking_conflicts.values.count}`);
  }
  
  console.log('\n================\n');
  
  // Return reports
  return {
    'test/load/results/k6-load-test.html': htmlReport(data),
    'test/load/results/k6-load-test.json': JSON.stringify(data, null, 2),
    stdout: '', // Suppress default summary since we have custom output above
  };
}
