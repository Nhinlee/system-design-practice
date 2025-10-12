/**
 * k6 Stress Test
 * High-intensity 60-second test to stress the system
 * 
 * Equivalent to: test/load/stress-test-custom.yml
 * 
 * Run with: k6 run test/load/k6-stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  // Stress test: 50 concurrent users for 60 seconds
  vus: 50,
  duration: '60s',
  
  // Thresholds
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
  // First request: List doctors
  let response = http.get(`${BASE_URL}/doctors?page=1&limit=10`);
  
  let success = check(response, {
    'doctors list status is 200': (r) => r.status === 200,
  });
  
  errorRate.add(!success);
  
  // Small pause
  sleep(0.1);
  
  // Second request: List appointments
  response = http.get(`${BASE_URL}/appointments?page=1&limit=20`);
  
  success = check(response, {
    'appointments list status is 200': (r) => r.status === 200,
  });
  
  errorRate.add(!success);
  
  // Small pause before next iteration
  sleep(0.1);
}

// Setup function
export function setup() {
  console.log('🚀 Starting stress test...');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log('💪 Running 50 concurrent users for 60 seconds');
}

// Teardown function
export function teardown(data) {
  console.log('✅ Stress test completed!');
}

// Handle test summary
export function handleSummary(data) {
  return {
    'test/load/results/k6-stress-test.html': htmlReport(data),
    'test/load/results/k6-stress-test.json': JSON.stringify(data, null, 2),
    stdout: '\n' + JSON.stringify(data, null, 2) + '\n',
  };
}
