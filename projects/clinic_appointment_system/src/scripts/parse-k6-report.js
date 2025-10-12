#!/usr/bin/env node

/**
 * Parse k6 NDJSON output and display a formatted report
 * k6 outputs metrics as newline-delimited JSON (NDJSON)
 */

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
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function parseK6Report(filePath, title = 'Load Test') {
  if (!fs.existsSync(filePath)) {
    log(`❌ Report file not found: ${filePath}`, 'red');
    process.exit(1);
  }

  const data = fs.readFileSync(filePath, 'utf8');
  const lines = data.trim().split('\n');
  const metrics = {};

  // Parse NDJSON - each line is a separate JSON object
  lines.forEach((line, index) => {
    try {
      const point = JSON.parse(line);
      
      // k6 outputs "Point" type for metric data points
      if (point.type === 'Point') {
        const metricName = point.metric;
        
        // Store the last data point for each metric
        if (!metrics[metricName]) {
          metrics[metricName] = point.data;
        } else {
          // Update with latest value
          metrics[metricName] = point.data;
        }
      }
    } catch (e) {
      // Skip invalid lines
    }
  });

  // Display the report
  console.log('');
  log(`📊 ${title} Results`, 'cyan');
  log('═'.repeat(60), 'blue');
  console.log('');

  // HTTP Request metrics
  if (metrics.http_reqs) {
    log(`📈 Total HTTP Requests:        ${Math.round(metrics.http_reqs.value).toLocaleString()}`, 'bright');
  }

  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.value * 100);
    const successRate = (100 - failRate);
    const color = failRate < 1 ? 'green' : failRate < 5 ? 'yellow' : 'red';
    
    log(`✅ HTTP Success Rate:          ${successRate.toFixed(2)}%`, color);
    log(`❌ HTTP Failure Rate:          ${failRate.toFixed(2)}%`, color);
  }

  // Response time metrics
  if (metrics.http_req_duration) {
    const rt = metrics.http_req_duration;
    console.log('');
    log(`⏱️  Response Time Metrics:`, 'bright');
    log(`   - Min:                      ${(rt.min || 0).toFixed(2)}ms`, 'reset');
    log(`   - Average:                  ${(rt.avg || 0).toFixed(2)}ms`, 'reset');
    log(`   - Median:                   ${(rt.med || 0).toFixed(2)}ms`, 'reset');
    log(`   - P90:                      ${(rt.p90 || 0).toFixed(2)}ms`, rt.p90 <= 1500 ? 'green' : 'yellow');
    log(`   - P95:                      ${(rt.p95 || 0).toFixed(2)}ms`, rt.p95 <= 2000 ? 'green' : 'yellow');
    log(`   - P99:                      ${(rt.p99 || 0).toFixed(2)}ms`, rt.p99 <= 5000 ? 'green' : 'red');
    log(`   - Max:                      ${(rt.max || 0).toFixed(2)}ms`, 'reset');
  }

  // VU metrics
  if (metrics.vus) {
    console.log('');
    log(`👥 Virtual Users:              ${Math.round(metrics.vus.value)}`, 'cyan');
  }

  // Iteration metrics
  if (metrics.iterations) {
    log(`🔄 Iterations Completed:       ${Math.round(metrics.iterations.value).toLocaleString()}`, 'cyan');
  }

  // Data transfer metrics
  if (metrics.data_received) {
    const mb = metrics.data_received.value / (1024 * 1024);
    log(`📥 Data Received:               ${mb.toFixed(2)} MB`, 'cyan');
  }

  if (metrics.data_sent) {
    const mb = metrics.data_sent.value / (1024 * 1024);
    log(`📤 Data Sent:                   ${mb.toFixed(2)} MB`, 'cyan');
  }

  // Custom business metrics
  const hasCustomMetrics = metrics.booking_success || metrics.booking_conflicts || metrics.errors;
  
  if (hasCustomMetrics) {
    console.log('');
    log(`🎯 Custom Business Metrics:`, 'bright');
    
    if (metrics.booking_success) {
      const rate = (metrics.booking_success.value * 100);
      const color = rate > 80 ? 'green' : rate > 60 ? 'yellow' : 'red';
      log(`   ✅ Booking Success Rate:     ${rate.toFixed(2)}%`, color);
    }
    
    if (metrics.booking_conflicts) {
      const rate = (metrics.booking_conflicts.value * 100);
      log(`   ⚠️  Booking Conflict Rate:    ${rate.toFixed(2)}%`, 'yellow');
    }
    
    if (metrics.errors) {
      const rate = (metrics.errors.value * 100);
      const color = rate < 1 ? 'green' : rate < 5 ? 'yellow' : 'red';
      log(`   ❌ Custom Error Rate:        ${rate.toFixed(2)}%`, color);
    }
  }

  // Performance Verdict
  console.log('');
  log('═'.repeat(60), 'blue');
  console.log('');
  
  const failRate = metrics.http_req_failed?.value || 0;
  const p95 = metrics.http_req_duration?.p95 || 0;
  const p99 = metrics.http_req_duration?.p99 || 0;
  
  log('📈 Performance Verdict:', 'bright');
  
  if (failRate < 0.01 && p95 < 2000 && p99 < 5000) {
    log('   ✅ EXCELLENT - System performing optimally!', 'green');
    log('   All metrics are within acceptable thresholds.', 'green');
  } else if (failRate < 0.05 && p95 < 5000) {
    log('   ⚠️  ACCEPTABLE - Minor performance degradation detected', 'yellow');
    if (failRate >= 0.01) log('   - Consider investigating error rate', 'yellow');
    if (p95 >= 2000) log('   - Response times could be improved', 'yellow');
  } else {
    log('   ❌ POOR - Significant performance issues detected', 'red');
    if (failRate >= 0.05) log('   - High error rate requires immediate attention!', 'red');
    if (p95 >= 5000) log('   - Response times are unacceptably high!', 'red');
  }
  
  console.log('');
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node parse-k6-report.js <path-to-k6-json> [title]');
  console.log('Example: node parse-k6-report.js test/load/results/k6-load-test.json "Load Test"');
  process.exit(1);
}

const filePath = path.resolve(args[0]);
const title = args[1] || 'k6 Test';

parseK6Report(filePath, title);
