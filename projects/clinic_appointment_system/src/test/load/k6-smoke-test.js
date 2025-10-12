/**
 * k6 Smoke Test
 * Quick 30-second validation test at 10 req/sec
 * 
 * Run: k6 run test/load/k6-smoke-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  // Smoke test: 10 VUs for 30 seconds
  vus: 10,
  duration: '30s',
  
  // Thresholds (SLA)
  thresholds: {
    http_req_failed: ['rate<0.05'], // Error rate < 5%
    http_req_duration: ['p(95)<3000', 'p(99)<5000'], // P95 < 3s, P99 < 5s
    errors: ['rate<0.05'],
  },
  
  // Tags for better organization
  tags: {
    test_type: 'smoke',
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Scenario 1: List Doctors (50% probability)
  if (Math.random() < 0.5) {
    const response = http.get(`${BASE_URL}/doctors?page=1&limit=10`);
    
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'is JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
      'has data': (r) => JSON.parse(r.body).data !== undefined,
    });
    
    errorRate.add(!success);
  } 
  // Scenario 2: List Appointments (50% probability)
  else {
    const response = http.get(`${BASE_URL}/appointments?page=1&limit=10`);
    
    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'is JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json'),
    });
    
    errorRate.add(!success);
  }
  
  // Small delay between requests (simulating user think time)
  sleep(0.1);
}

// Setup function (runs once before test)
export function setup() {
  console.log('🔥 Starting smoke test...');
  console.log('⏱️  Duration: 30 seconds');
  console.log('👥 Virtual Users: 10');
  console.log('🎯 Target: ' + BASE_URL);
}

// Teardown function (runs once after test)
export function teardown(data) {
  console.log('✅ Smoke test completed!');
}

// Generate HTML report
export function handleSummary(data) {
  return {
    'test/load/results/k6-smoke-test.html': htmlReport(data),
    stdout: '\n' + JSON.stringify(data, null, 2) + '\n',
  };
}
