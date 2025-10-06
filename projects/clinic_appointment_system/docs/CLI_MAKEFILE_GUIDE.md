# CLI and Makefile Usage Guide

This document explains how to use the Makefile and CLI utilities for the Clinic Appointment System.

## Table of Contents
- [Quick Start](#quick-start)
- [Makefile Commands](#makefile-commands)
- [CLI Utility](#cli-utility)
- [Common Workflows](#common-workflows)

---

## Quick Start

### Prerequisites
```bash
# Install dependencies
make install

# Start Docker services (PostgreSQL)
make docker-up

# Setup database
make db-migrate
make db-seed

# Start development server
make dev
```

### Run Tests
```bash
# Quick validation (30 seconds)
make test-smoke

# Full load test (8 minutes)
make test-load

# All tests
make test-all
```

---

## Makefile Commands

### Development Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make dev` | Start development server with hot-reload |
| `make build` | Build production bundle |
| `make lint` | Run ESLint code checker |
| `make format` | Format code with Prettier |

### Docker Commands

| Command | Description |
|---------|-------------|
| `make docker-up` | Start PostgreSQL and pgAdmin |
| `make docker-down` | Stop all Docker services |
| `make docker-logs` | View Docker container logs |
| `make docker-restart` | Restart all Docker services |

**Service URLs:**
- PostgreSQL: `localhost:5432`
- pgAdmin: `http://localhost:5050`

### Database Commands

| Command | Description |
|---------|-------------|
| `make db-migrate` | Run Prisma migrations |
| `make db-seed` | Seed database with test data |
| `make db-reset` | Reset database (migrate + seed) |
| `make db-studio` | Open Prisma Studio UI |
| `make db-generate` | Generate Prisma client |

**Seed Data:**
- 1 Admin user
- 5 Doctors (various specialties)
- 20 Patients
- 800 Time slots (14 days)
- 240 Appointments (30% booking rate)

### Testing Commands

| Command | Description | Duration |
|---------|-------------|----------|
| `make test` | Run all unit tests | ~5s |
| `make test-unit` | Run unit tests only | ~5s |
| `make test-e2e` | Run E2E integration tests | ~10s |
| `make test-cov` | Run tests with coverage | ~10s |
| `make test-smoke` | Quick load test validation | 30s |
| `make test-load` | Full load test | 8min |
| `make test-all` | All test suites | ~1min |

### Report Commands

| Command | Description |
|---------|-------------|
| `make report-smoke` | Show smoke test metrics |
| `make report-load` | Show load test metrics |
| `make report-coverage` | Open coverage HTML report |

### Cleanup Commands

| Command | Description |
|---------|-------------|
| `make clean` | Remove dist, coverage, test results |
| `make clean-all` | Remove everything including node_modules |

### Production Commands

| Command | Description |
|---------|-------------|
| `make prod-build` | Build for production |
| `make prod-start` | Start production server |
| `make quickstart` | Setup everything for new developers |
| `make check` | Production readiness check |

---

## CLI Utility

The CLI provides more advanced features with better output formatting.

### Basic Usage
```bash
# Run CLI
./cli.js <command> [options]

# Or use npm scripts
npm run cli <command>
```

### Available Commands

#### Health Check
```bash
./cli.js health
```
**Output:**
- ✅ Application status
- ✅ PostgreSQL status  
- ✅ Database connection
- ✅ Quick diagnostic

#### Testing Commands

**Smoke Test** (30 seconds)
```bash
./cli.js test:smoke
npm run smoke
```

**Full Load Test** (8 minutes)
```bash
./cli.js test:load
npm run load
```

**Custom Stress Test**
```bash
# Syntax: test:stress [duration] [rate]
./cli.js test:stress 120 75    # 2 min at 75 req/sec
./cli.js test:stress 300 100   # 5 min at 100 req/sec
```

#### Report Commands

```bash
# Show smoke test results
./cli.js report:smoke

# Show load test results
./cli.js report:load
```

**Report includes:**
- 📊 Total requests
- ✅ Success rate
- ❌ Error rate
- ⏱️ Response times (min, mean, p95, p99, max)
- 🔢 HTTP status code breakdown
- ✅/⚠️/❌ Performance verdict

#### Database Commands

```bash
# Seed database
./cli.js db:seed

# Reset database (destructive!)
./cli.js db:reset
```

---

## Common Workflows

### 1. First Time Setup
```bash
# Install everything
make quickstart

# Start development
make dev

# In another terminal, check health
./cli.js health
```

### 2. Daily Development
```bash
# Start services
make docker-up
make dev

# Run tests before commit
make lint
make test
```

### 3. Load Testing
```bash
# Ensure app is running
make dev

# Quick validation
make test-smoke
make report-smoke

# Full test
make test-load
./cli.js report:load
```

### 4. Production Readiness Check
```bash
# Run full check
make check

# View results
./cli.js report:load
make report-coverage
```

### 5. Database Management
```bash
# Reset with fresh data
make db-reset

# View data in UI
make db-studio

# Run migration
make db-migrate
```

### 6. Continuous Testing
```bash
# Watch mode for unit tests
npm run test:watch

# Quick smoke test loop (for debugging)
while true; do make test-smoke; sleep 10; done
```

### 7. Performance Benchmarking
```bash
# Start fresh
make db-reset

# Run progressive load tests
./cli.js test:stress 60 10    # Baseline
./cli.js test:stress 60 25    # Medium
./cli.js test:stress 60 50    # High
./cli.js test:stress 60 100   # Peak

# Compare results
./cli.js report:load
```

---

## Examples

### Example 1: Quick Health Check
```bash
$ ./cli.js health

🏥 System Health Check

Checking application status...
✅ Application: Running

Checking Docker services...
✅ PostgreSQL: Running

Checking database connection...
✅ Database: Connected
```

### Example 2: Load Test Report
```bash
$ ./cli.js report:load

📊 Full Load Test Results
──────────────────────────────────────────────────
Total Requests:     12,450
Success Rate:       99.8%
Error Rate:         0.2%

Response Time (ms):
  Min:              3
  Mean:             45.2
  Median:           38
  P95:              125
  P99:              280
  Max:              890

HTTP Status Codes:
  200:              12,425
  409:              20
  400:              5

──────────────────────────────────────────────────
✅ PASS - All metrics within acceptable range
```

### Example 3: Custom Stress Test
```bash
$ ./cli.js test:stress 120 75

⚡ Running Custom Stress Test
Duration: 120s, Rate: 75 req/sec

[Artillery output...]

✅ Stress test completed!

📊 Stress Test Results
[Detailed metrics...]
```

---

## Performance Thresholds

### Smoke Test (10 req/sec)
- ✅ P95: < 200ms
- ✅ P99: < 500ms
- ✅ Error rate: < 5%

### Load Test (up to 100 req/sec)
- ✅ P95: < 2000ms
- ✅ P99: < 5000ms
- ✅ Error rate: < 1%

### Production SLA
- ✅ Availability: 99.9%
- ✅ Read latency (P95): < 200ms
- ✅ Write latency (P95): < 500ms

---

## Troubleshooting

### Issue: "Application not running"
```bash
# Check if running
./cli.js health

# Start application
make dev
```

### Issue: "PostgreSQL not running"
```bash
# Start Docker
make docker-up

# Check logs
make docker-logs
```

### Issue: "Database connection failed"
```bash
# Reset database
make db-reset

# Check Prisma
make db-studio
```

### Issue: "Tests failing"
```bash
# Ensure fresh data
make db-reset

# Check app health
./cli.js health

# Run smoke test first
make test-smoke
```

---

## Tips & Best Practices

1. **Always check health first**: `./cli.js health`
2. **Use smoke tests before load tests**: Validate quickly
3. **Reset database for consistent tests**: `make db-reset`
4. **Monitor during load tests**: Use Prisma Studio or pgAdmin
5. **Check reports after tests**: `./cli.js report:load`
6. **Use Makefile for common tasks**: Easier to remember
7. **Use CLI for advanced features**: Better output formatting

---

## Integration with CI/CD

```yaml
# GitHub Actions example
name: Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: make install
      - run: make docker-up
      - run: make db-migrate
      - run: make db-seed
      - run: make check  # Runs lint + all tests
```

---

## Help

```bash
# Makefile help
make help

# CLI help
./cli.js help
./cli.js --help
./cli.js -h
```
