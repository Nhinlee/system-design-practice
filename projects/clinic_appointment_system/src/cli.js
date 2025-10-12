#!/usr/bin/env node

/**
 * Clinic Appointment System - CLI Utility
 * 
 * Usage:
 *   ./cli.js <command> [options]
 * 
 * Commands:
 *   test:smoke                    - Run smoke test
 *   test:load                     - Run full load test
 *   test:stress [duration] [rate] - Run custom stress test
 *   report:smoke                  - Show smoke test report
 *   report:load                   - Show load test report
 *   db:seed                       - Seed database
 *   db:reset                      - Reset database
 *   health                        - Check system health
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    return execSync(command, { 
      encoding: 'utf-8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
  } catch (error) {
    if (!options.ignoreError) {
      log(`❌ Command failed: ${command}`, 'red');
      process.exit(1);
    }
    return null;
  }
}

async function checkHealth() {
  log('\n🏥 System Health Check\n', 'cyan');
  
  // Check if app is running
  log('Checking application status...', 'blue');
  const appResponse = exec('curl -s http://localhost:3000/doctors?page=1&limit=1', { 
    silent: true, 
    ignoreError: true 
  });
  
  if (appResponse && appResponse.includes('"success":true')) {
    log('✅ Application: Running', 'green');
  } else {
    log('❌ Application: Not running', 'red');
    log('   Run: pnpm run start:dev', 'yellow');
  }
  
  // Check Docker
  log('\nChecking Docker services...', 'blue');
  const dockerStatus = exec('docker ps --filter "name=postgres" --format "{{.Status}}"', { 
    silent: true, 
    ignoreError: true 
  });
  
  if (dockerStatus && dockerStatus.includes('Up')) {
    log('✅ PostgreSQL: Running', 'green');
  } else {
    log('❌ PostgreSQL: Not running', 'red');
    log('   Run: make docker-up', 'yellow');
  }
  
  // Check database connection
  log('\nChecking database connection...', 'blue');
  const dbCheck = exec('curl -s http://localhost:3000/doctors?page=1&limit=1', { 
    silent: true, 
    ignoreError: true 
  });
  
  if (dbCheck && dbCheck.includes('"data"')) {
    log('✅ Database: Connected', 'green');
  } else {
    log('❌ Database: Connection issue', 'red');
  }
  
  log('\n');
}

function runSmokeTest() {
  log('\n💨 Running Smoke Test (30 seconds)\n', 'cyan');
  log('This will test the system with ~10 virtual users...', 'blue');
  
  exec('k6 run test/load/k6-smoke-test.js');
  
  log('\n✅ Smoke test completed!', 'green');
}

function runLoadTest() {
  log('\n🔥 Running Full Load Test (8 minutes)\n', 'cyan');
  log('Phases: Warm-up → Ramp-up → Peak → Spike → Cool-down', 'blue');
  log('Peak load: 100 virtual users\n', 'yellow');
  
  exec('k6 run test/load/k6-load-test.js');
  
  log('\n✅ Load test completed!', 'green');
}

function runStressTest(duration = 60, vus = 50) {
  log(`\n⚡ Running Custom Stress Test\n`, 'cyan');
  log(`Duration: ${duration}s, Virtual Users: ${vus}\n`, 'blue');
  
  // Create temporary k6 stress test script
  const script = `
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: ${vus},
  duration: '${duration}s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  http.get(\`\${BASE_URL}/doctors?page=1&limit=10\`);
  http.get(\`\${BASE_URL}/appointments?page=1&limit=20\`);
  sleep(0.5);
}
`;
  
  const scriptFile = 'test/load/k6-stress-custom.js';
  fs.writeFileSync(scriptFile, script);
  
  exec(`k6 run ${scriptFile}`);
  
  log('\n✅ Stress test completed!', 'green');
}

function showReport(filePath, title) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    // Check if it's k6 format (has metrics property)
    if (data.metrics) {
      showK6Report(data, title);
    } else {
      log(`\n⚠️  k6 JSON output format has changed. View raw file: ${filePath}`, 'yellow');
    }
  } catch (error) {
    log(`❌ Error reading report: ${error.message}`, 'red');
    log(`💡 k6 results are displayed in the console output`, 'yellow');
  }
}

function showK6Report(data, title) {
  const m = data.metrics;
  
  log(`\n📊 ${title} Results\n`, 'cyan');
  log('─'.repeat(50), 'blue');
  
  const totalRequests = m.http_reqs ? m.http_reqs.values.count : 0;
  const failedRate = m.http_req_failed ? m.http_req_failed.values.rate : 0;
  const successRate = ((1 - failedRate) * 100).toFixed(2);
  
  log(`Total Requests:     ${totalRequests.toLocaleString()}`, 'bright');
  log(`Success Rate:       ${successRate}%`, successRate >= 99 ? 'green' : 'yellow');
  log(`Failed Requests:    ${(failedRate * 100).toFixed(2)}%`, failedRate <= 0.01 ? 'green' : 'red');
  log('', 'reset');
  
  if (m.http_req_duration) {
    const rt = m.http_req_duration.values;
    log(`Response Time (ms):`, 'bright');
    log(`  Min:              ${rt.min.toFixed(1)}`, 'reset');
    log(`  Mean:             ${rt.avg.toFixed(1)}`, 'reset');
    log(`  Median:           ${rt.med.toFixed(1)}`, 'reset');
    log(`  P90:              ${rt['p(90)'].toFixed(1)}`, rt['p(90)'] <= 1500 ? 'green' : 'yellow');
    log(`  P95:              ${rt['p(95)'].toFixed(1)}`, rt['p(95)'] <= 2000 ? 'green' : 'yellow');
    log(`  P99:              ${rt['p(99)'].toFixed(1)}`, rt['p(99)'] <= 5000 ? 'green' : 'yellow');
    log(`  Max:              ${rt.max.toFixed(1)}`, 'reset');
    log('', 'reset');
  }
  
  // Custom metrics if available
  if (m.booking_success) {
    log(`Booking Metrics:`, 'bright');
    log(`  Success Rate:     ${(m.booking_success.values.rate * 100).toFixed(2)}%`, 'green');
    if (m.booking_conflicts) {
      log(`  Conflict Rate:    ${(m.booking_conflicts.values.rate * 100).toFixed(2)}%`, 'yellow');
    }
    log('', 'reset');
  }
  
  log('─'.repeat(50), 'blue');
  
  // Performance verdict
  const p95 = m.http_req_duration ? m.http_req_duration.values['p(95)'] : 9999;
  const errorRate = failedRate * 100;
  
  if (successRate >= 99 && errorRate <= 1 && p95 <= 2000) {
    log('\n✅ PASS - All metrics within acceptable range', 'green');
  } else if (successRate >= 95 && errorRate <= 5) {
    log('\n⚠️  WARNING - Some metrics need attention', 'yellow');
  } else {
    log('\n❌ FAIL - Performance issues detected', 'red');
  }
  
  log('');
}

function seedDatabase() {
  log('\n🌱 Seeding Database\n', 'cyan');
  exec('pnpm run db:seed');
  log('\n✅ Database seeded successfully!', 'green');
}

function resetDatabase() {
  log('\n♻️  Resetting Database\n', 'cyan');
  log('⚠️  This will delete all data and re-run migrations!', 'yellow');
  
  exec('npx prisma migrate reset --force');
  exec('pnpm run db:seed');
  
  log('\n✅ Database reset complete!', 'green');
}

function showHelp() {
  log('\n📋 Clinic Appointment System - CLI Utility\n', 'cyan');
  log('Usage: ./cli.js <command> [options]\n', 'bright');
  
  log('Commands:', 'bright');
  log('  health                        - Check system health', 'reset');
  log('  test:smoke                    - Run smoke test (30s, k6)', 'reset');
  log('  test:load                     - Run full load test (8min, k6)', 'reset');
  log('  test:stress [duration] [vus]  - Run custom stress test', 'reset');
  log('  report:smoke                  - Show smoke test report', 'reset');
  log('  report:load                   - Show load test report', 'reset');
  log('  db:seed                       - Seed database with test data', 'reset');
  log('  db:reset                      - Reset database (destructive)', 'reset');
  log('\nExamples:', 'bright');
  log('  ./cli.js health', 'yellow');
  log('  ./cli.js test:smoke', 'yellow');
  log('  ./cli.js test:stress 120 75   # 2 min with 75 VUs', 'yellow');
  log('  ./cli.js report:load', 'yellow');
  log('\nNote: Load tests now use k6 instead of Artillery', 'cyan');
  log('');
}

// Main CLI logic
const command = process.argv[2];
const args = process.argv.slice(3);

switch (command) {
  case 'health':
    checkHealth();
    break;
  
  case 'test:smoke':
    runSmokeTest();
    break;
  
  case 'test:load':
    runLoadTest();
    break;
  
  case 'test:stress':
    runStressTest(parseInt(args[0]) || 60, parseInt(args[1]) || 50);
    break;
  
  case 'report:smoke':
    showReport('test/load/results/smoke-test.json', 'Smoke Test');
    break;
  
  case 'report:load':
    showReport('test/load/results/full-load-test.json', 'Full Load Test');
    break;
  
  case 'db:seed':
    seedDatabase();
    break;
  
  case 'db:reset':
    resetDatabase();
    break;
  
  case 'help':
  case '--help':
  case '-h':
  default:
    showHelp();
    break;
}
