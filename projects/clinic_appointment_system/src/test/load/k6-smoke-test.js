/**
 * k6 Smoke Test
 * Quick 30-second test to validate system is working
 * 
 * Equivalent to: test/load/smoke-test.yml
 * 
 * Run with: k6 run test/load/k6-smoke-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  // Test duration and virtual users
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 VUs over 30s
  ],
  
  // Thresholds (equivalent to Artillery's ensure)
  thresholds: {
    'http_req_failed': ['rate<0.05'], // Error rate < 5%
    'http_req_duration': [
      'p(95)<3000', // 95th percentile < 3s
      'p(99)<5000', // 99th percentile < 5s
    ],
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Randomly choose a scenario (50/50 split)
  const scenario = Math.random() < 0.5 ? 'listDoctors' : 'listAppointments';
  
  if (scenario === 'listDoctors') {
    // Scenario 1: List Doctors
    const response = http.get(`${BASE_URL}/doctors?page=1&limit=10`);
    
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'content-type is JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    });
    
    errorRate.add(!success);
    
  } else {
    // Scenario 2: List Appointments
    const response = http.get(`${BASE_URL}/appointments?page=1&limit=10`);
    
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'content-type is JSON': (r) => r.headers['Content-Type']?.includes('application/json'),
    });
    
    errorRate.add(!success);
  }
  
  // Small sleep to simulate real user behavior
  sleep(0.1);
}

// Setup function - runs once at the start
export function setup() {
  console.log('🚀 Starting smoke test...');
  console.log(`📍 Target: ${BASE_URL}`);
}

// Teardown function - runs once at the end
export function teardown(data) {
  console.log('✅ Smoke test completed!');
}

// Handle test summary for custom reporting
export function handleSummary(data) {
  return {
    'test/load/results/k6-smoke-test.html': htmlReport(data),
    stdout: '\n' + JSON.stringify(data, null, 2) + '\n',
  };
}
