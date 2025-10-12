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
  log('This will test the system with 10 VUs...', 'blue');
  
  // Ensure results directory exists
  if (!fs.existsSync('test/load/results')) {
    fs.mkdirSync('test/load/results', { recursive: true });
  }
  
  exec('k6 run --out json=test/load/results/k6-smoke-test.json test/load/k6-smoke-test.js');
  
  log('\n✅ Smoke test completed!', 'green');
  log('📊 HTML report: test/load/results/k6-smoke-test.html', 'blue');
  log('📄 JSON data: test/load/results/k6-smoke-test.json', 'blue');
}

function runLoadTest() {
  log('\n🔥 Running Full Load Test (8 minutes)\n', 'cyan');
  log('Phases: Warm-up → Ramp-up → Peak → Spike → Cool-down', 'blue');
  log('Peak load: 100 VUs\n', 'yellow');
  
  // Ensure results directory exists
  if (!fs.existsSync('test/load/results')) {
    fs.mkdirSync('test/load/results', { recursive: true });
  }
  
  exec('k6 run --out json=test/load/results/k6-load-test.json test/load/k6-load-test.js');
  
  log('\n✅ Load test completed!', 'green');
  log('📊 HTML report: test/load/results/k6-load-test.html', 'blue');
  log('📄 JSON data: test/load/results/k6-load-test.json', 'blue');
}

function runStressTest(duration = 60, vus = 50) {
  log(`\n⚡ Running Stress Test\n`, 'cyan');
  log(`Duration: ${duration}s, VUs: ${vus}\n`, 'blue');
  
  // Ensure results directory exists
  if (!fs.existsSync('test/load/results')) {
    fs.mkdirSync('test/load/results', { recursive: true });
  }
  
  // Run k6 with custom options
  exec(`k6 run --vus ${vus} --duration ${duration}s --out json=test/load/results/k6-stress-test.json test/load/k6-stress-test.js`);
  
  log('\n✅ Stress test completed!', 'green');
  log('📊 HTML report: test/load/results/k6-stress-test.html', 'blue');
  log('📄 JSON data: test/load/results/k6-stress-test.json', 'blue');
}

function openHtmlReport(filePath, title) {
  log(`\n📊 Opening ${title} HTML Report\n`, 'cyan');
  
  if (!fs.existsSync(filePath)) {
    log(`❌ Report not found: ${filePath}`, 'red');
    log('Run the test first to generate the report.', 'yellow');
    return;
  }
  
  log(`📂 Report location: ${filePath}`, 'blue');
  
  // Open in default browser (macOS)
  exec(`open ${filePath}`, { silent: true });
  
  log('✅ Opening report in browser...', 'green');
}

// Legacy function - kept for backward compatibility with Artillery JSON reports
function showReport(filePath, title) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const agg = data.aggregate;
    
    log(`\n📊 ${title} Results\n`, 'cyan');
    log('─'.repeat(50), 'blue');
    
    const totalRequests = agg.counters['http.requests'] || 0;
    const failed = agg.counters['vusers.failed'] || 0;
    const completed = agg.counters['vusers.completed'] || 1;
    const successRate = (100 - (failed / completed * 100)).toFixed(2);
    
    const codes4xx = Object.keys(agg.counters)
      .filter(k => k.startsWith('http.codes.4'))
      .reduce((sum, k) => sum + agg.counters[k], 0);
    
    const codes5xx = Object.keys(agg.counters)
      .filter(k => k.startsWith('http.codes.5'))
      .reduce((sum, k) => sum + agg.counters[k], 0);
    
    const errorRate = ((codes4xx + codes5xx) / totalRequests * 100).toFixed(2);
    
    log(`Total Requests:     ${totalRequests.toLocaleString()}`, 'bright');
    log(`Success Rate:       ${successRate}%`, successRate >= 99 ? 'green' : 'yellow');
    log(`Error Rate:         ${errorRate}%`, errorRate <= 1 ? 'green' : 'red');
    log('', 'reset');
    
    const rt = agg.summaries['http.response_time'] || {};
    log(`Response Time (ms):`, 'bright');
    log(`  Min:              ${rt.min || 'N/A'}`, 'reset');
    log(`  Mean:             ${(rt.mean || 0).toFixed(1)}`, 'reset');
    log(`  Median:           ${rt.median || 'N/A'}`, 'reset');
    log(`  P95:              ${rt.p95 || 'N/A'}`, rt.p95 <= 2000 ? 'green' : 'yellow');
    log(`  P99:              ${rt.p99 || 'N/A'}`, rt.p99 <= 5000 ? 'green' : 'yellow');
    log(`  Max:              ${rt.max || 'N/A'}`, 'reset');
    log('', 'reset');
    
    log(`HTTP Status Codes:`, 'bright');
    Object.keys(agg.counters)
      .filter(k => k.startsWith('http.codes.'))
      .sort()
      .forEach(key => {
        const code = key.replace('http.codes.', '');
        const count = agg.counters[key];
        const color = code.startsWith('2') ? 'green' : code.startsWith('4') ? 'yellow' : 'red';
        log(`  ${code}:              ${count.toLocaleString()}`, color);
      });
    
    log('\n' + '─'.repeat(50), 'blue');
    
    // Performance verdict
    if (successRate >= 99 && errorRate <= 1 && rt.p95 <= 2000) {
      log('\n✅ PASS - All metrics within acceptable range', 'green');
    } else if (successRate >= 95 && errorRate <= 5) {
      log('\n⚠️  WARNING - Some metrics need attention', 'yellow');
    } else {
      log('\n❌ FAIL - Performance issues detected', 'red');
    }
    
    log('');
  } catch (error) {
    log(`❌ Error reading report: ${error.message}`, 'red');
  }
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
  log('  test:smoke                    - Run smoke test (30s)', 'reset');
  log('  test:load                     - Run full load test (8min)', 'reset');
  log('  test:stress [duration] [rate] - Run custom stress test', 'reset');
  log('  report:smoke                  - Show smoke test report', 'reset');
  log('  report:load                   - Show load test report', 'reset');
  log('  db:seed                       - Seed database with test data', 'reset');
  log('  db:reset                      - Reset database (destructive)', 'reset');
  log('\nExamples:', 'bright');
  log('  ./cli.js health', 'yellow');
  log('  ./cli.js test:smoke', 'yellow');
  log('  ./cli.js test:stress 120 75   # 2 min at 75 req/sec', 'yellow');
  log('  ./cli.js report:load', 'yellow');
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
    openHtmlReport('test/load/results/k6-smoke-test.html', 'Smoke Test');
    break;
  
  case 'report:load':
    openHtmlReport('test/load/results/k6-load-test.html', 'Load Test');
    break;
  
  case 'report:stress':
    openHtmlReport('test/load/results/k6-stress-test.html', 'Stress Test');
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
