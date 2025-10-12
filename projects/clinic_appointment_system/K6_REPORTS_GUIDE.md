# k6 Load Testing - Viewing Reports

This guide explains how to view and analyze k6 load test results for the Clinic Appointment System.

## Quick Reference

### Run Tests and See Reports

```bash
# 1. Run smoke test (saves results automatically)
make test-smoke

# 2. View smoke test report (console)
make report-smoke

# 3. View smoke test report (HTML in browser) ✨
make report-html-smoke

# 4. Run load test (saves results automatically)
make test-load

# 5. View load test report (console)
make report-load

# 6. View load test report (HTML in browser) ✨
make report-html-load
```

## Report Methods

### Method 1: Real-time Console Output (Default)

k6 automatically displays results in the console during and after test execution:

```bash
make test-smoke
# or
k6 run test/load/k6-smoke-test.js
```

**What you'll see:**
- ✅ Live progress during test execution
- 📊 Summary table with all metrics
- ✓/✗ Threshold pass/fail status
- 📈 Performance statistics (P90, P95, P99, etc.)

### Method 2: Formatted Report from JSON (Recommended)

Tests automatically save JSON output. View formatted reports:

```bash
# After running tests
make report-smoke    # Smoke test report
make report-load     # Load test report
```

**What you'll see:**
```
📊 Comprehensive Load Test Results
═══════════════════════════════════════════════════════════

📈 Total HTTP Requests:        45,231
✅ HTTP Success Rate:          99.87%
❌ HTTP Failure Rate:          0.13%

⏱️  Response Time Metrics:
   - Min:                      12.45ms
   - Average:                  145.67ms
   - Median:                   132.23ms
   - P90:                      234.56ms
   - P95:                      312.89ms
   - P99:                      567.12ms
   - Max:                      1234.56ms

🎯 Custom Business Metrics:
   ✅ Booking Success Rate:     85.43%
   ⚠️  Booking Conflict Rate:    2.34%

═══════════════════════════════════════════════════════════

📈 Performance Verdict:
   ✅ EXCELLENT - System performing optimally!
   All metrics are within acceptable thresholds.
```

### Method 3: Direct JSON Analysis

View raw JSON data for detailed analysis:

```bash
# View raw k6 output (NDJSON format)
cat test/load/results/k6-load-test.json

# View last summary line (most recent metrics)
tail -1 test/load/results/k6-load-test.json | jq .
```

---

## 🌐 HTML Reports (Visual & Interactive)

### What is the HTML Report?

k6 automatically generates a beautiful, interactive HTML report that includes:

- **📊 Interactive Charts**: Visual graphs of response times, throughput, VUs
- **🎨 Color-coded Metrics**: Green/yellow/red based on performance thresholds
- **📈 Timeline Graphs**: See how performance changes over time
- **✅ Threshold Status**: Visual pass/fail indicators for all SLAs
- **📋 Detailed Tables**: Organized view of all metrics
- **🔍 Custom Metrics**: Your business-specific measurements (booking success, etc.)
- **📱 Responsive Design**: View on desktop, tablet, or mobile

### How to View HTML Reports

**Option 1: Automatic (Easiest)**

The HTML report is automatically generated when you run tests and can be opened with a single command:

```bash
# Run test, then open HTML report
make test-smoke && make report-html-smoke

# Or for load test
make test-load && make report-html-load
```

**Option 2: Manual**

Open the HTML file directly in your browser:

```bash
# For smoke test
open test/load/results/k6-smoke-test.html

# For load test
open test/load/results/k6-load-test.html
```

### HTML Report Contents

The HTML report includes several sections:

1. **Test Summary**
   - Total duration
   - Virtual users (min/max)
   - Total iterations
   - Data transferred

2. **HTTP Metrics**
   - Total requests
   - Success/failure rates
   - Request rate (req/s)
   - Response time distribution

3. **Response Time Chart**
   - Line graph showing latency over time
   - P95, P99, and average lines
   - Color-coded threshold zones

4. **Virtual Users Graph**
   - Shows VU ramp-up and ramp-down
   - Visualizes load test stages

5. **Checks & Thresholds**
   - ✅/❌ Visual status for each check
   - Pass percentage for validations
   - Threshold compliance status

6. **Custom Metrics**
   - Booking success rate
   - Conflict rate
   - Error rates
   - Any custom business metrics

### Sharing HTML Reports

The HTML report is a single, self-contained file that you can:

- **Email** to team members
- **Upload** to cloud storage (S3, Google Drive, etc.)
- **Archive** for historical comparison
- **Embed** in CI/CD reports
- **Open offline** - no server needed

```bash
# Copy report for sharing
cp test/load/results/k6-load-test.html ~/Desktop/load-test-$(date +%Y%m%d).html
```

---

### Method 4: Direct JSON Analysis

### Method 4: Custom JSON Output Location

Save results to a custom location:

```bash
# Smoke test with custom output
k6 run test/load/k6-smoke-test.js

# Load test with custom output
k6 run test/load/k6-load-test.js

# The HTML and JSON files are auto-generated in test/load/results/
```

**Note**: HTML reports are automatically generated - no extra configuration needed!

## Understanding k6 Output Formats

### Console Output Format

k6 displays:
- **Real-time metrics** during execution
- **Thresholds** with pass/fail indicators
- **Summary table** at the end

Example:
```
     ✓ status is 200
     ✓ has valid JSON
     ✓ response time < 500ms

     checks.........................: 99.87% ✓ 4512  ✗ 6
     http_req_duration..............: avg=145ms p(95)=312ms
     http_reqs......................: 4518   75.3/s
```

### JSON Output Format (NDJSON)

k6 outputs **Newline Delimited JSON (NDJSON)**:
- Each line is a separate JSON object
- Metric points have `type: "Point"`
- Summary data at the end

Example line:
```json
{"type":"Point","metric":"http_req_duration","data":{"value":145.67,"tags":{"status":"200"}}}
```

## Report Metrics Explained

### HTTP Metrics
- **Total Requests**: Number of HTTP requests made
- **Success Rate**: Percentage of successful requests (status 2xx/3xx)
- **Failure Rate**: Percentage of failed requests (status 4xx/5xx)

### Response Time Metrics
- **Min**: Fastest response time
- **Average**: Mean response time
- **Median**: 50th percentile (P50)
- **P90**: 90th percentile - 90% of requests faster than this
- **P95**: 95th percentile - 95% of requests faster than this
- **P99**: 99th percentile - 99% of requests faster than this
- **Max**: Slowest response time

### Virtual Users (VUs)
- Number of concurrent simulated users
- Smoke test: 10 VUs
- Load test: 5 → 50 → 100 → 20 VUs (staged)

### Custom Business Metrics
- **Booking Success Rate**: Percentage of successful bookings
- **Booking Conflict Rate**: Percentage of double-booking conflicts
- **Custom Error Rate**: Application-specific errors

## Performance Thresholds

### Smoke Test Thresholds
```javascript
{
  http_req_failed: ['rate<0.05'],      // < 5% errors
  http_req_duration: [
    'p(95)<3000',                       // P95 < 3s
    'p(99)<5000'                        // P99 < 5s
  ],
  errors: ['rate<0.05']                 // < 5% custom errors
}
```

### Load Test Thresholds
```javascript
{
  http_req_failed: ['rate<0.01'],      // < 1% errors
  http_req_duration: [
    'p(95)<2000',                       // P95 < 2s
    'p(99)<5000'                        // P99 < 5s
  ],
  booking_success: ['rate>0.8'],       // > 80% bookings succeed
  errors: ['rate<0.01']                 // < 1% custom errors
}
```

## Performance Verdict Criteria

### ✅ EXCELLENT
- Error rate < 1%
- P95 response time < 2s
- P99 response time < 5s
- All thresholds passing

### ⚠️ ACCEPTABLE
- Error rate < 5%
- P95 response time < 5s
- Minor threshold failures
- System stable but could improve

### ❌ POOR
- Error rate ≥ 5%
- P95 response time ≥ 5s
- Multiple threshold failures
- Requires immediate attention

## Advanced Reporting

### Viewing HTML Reports

k6 now automatically generates HTML reports! No extra tools needed:

```bash
# Run test (HTML is auto-generated)
make test-load

# Open HTML report in browser
make report-html-load

# Or open manually
open test/load/results/k6-load-test.html
```

The HTML report includes:
- 📊 Interactive charts and graphs
- 🎨 Color-coded metrics
- ✅ Threshold pass/fail status
- 📱 Mobile-responsive design
- 🔍 Drill-down capabilities

---

### Export to InfluxDB + Grafana

For real-time dashboards:

```bash
# Run k6 with InfluxDB output
k6 run --out influxdb=http://localhost:8086/k6 test/load/k6-load-test.js

# View in Grafana dashboard
# Import k6 Grafana dashboard: https://grafana.com/grafana/dashboards/2587
```

### Export to Cloud

Use k6 Cloud for advanced analytics:

```bash
# Run with k6 Cloud
k6 run --out cloud test/load/k6-load-test.js

# View results at: https://app.k6.io
```

## Troubleshooting

### No Report File Found

**Error**: `❌ No load test results found`

**Solution**:
```bash
# Make sure test completed successfully
make test-load

# Check if file exists
ls -la test/load/results/

# If missing, run test again
rm -rf test/load/results/*.json
make test-load
```

### Invalid JSON Format

**Error**: `Cannot parse JSON`

**Cause**: k6 uses NDJSON (newline-delimited), not standard JSON

**Solution**: Use the provided parser script:
```bash
node scripts/parse-k6-report.js test/load/results/k6-load-test.json
```

### All Requests Failing

**Error**: `100% failure rate`

**Cause**: Application not running

**Solution**:
```bash
# Start the application first
make dev

# In another terminal, run tests
make test-smoke
```

## Related Commands

```bash
# Run test and immediately view HTML report
make test-smoke && make report-html-smoke
make test-load && make report-html-load

# View console report
make report-smoke
make report-load

# Run all tests
make test-all

# View test help
make help

# Clean test results
rm -rf test/load/results/*

# List all report files
ls -lh test/load/results/
```

## Files Reference

- `test/load/k6-smoke-test.js` - Smoke test script
- `test/load/k6-load-test.js` - Load test script  
- `test/load/results/k6-smoke-test.html` - **Smoke test HTML report** ✨
- `test/load/results/k6-smoke-test.json` - Smoke test JSON data
- `test/load/results/k6-load-test.html` - **Load test HTML report** ✨
- `test/load/results/k6-load-test.json` - Load test JSON data
- `scripts/parse-k6-report.js` - Console report parser utility

## Next Steps

1. **Run Your First Test**:
   ```bash
   make dev              # Start app
   make test-smoke       # Run test
   make report-smoke     # View report
   ```

2. **Analyze Results**: Look for bottlenecks in response times

3. **Optimize**: Based on report findings, optimize slow endpoints

4. **Re-test**: Verify improvements with another test run

5. **Monitor**: Set up continuous load testing in CI/CD
