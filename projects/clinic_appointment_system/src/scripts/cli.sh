#!/bin/bash
# Clinic Appointment System - CLI Utility
# Quick commands for common tasks

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if app is running
check_app() {
    if curl -s http://localhost:3000/doctors?page=1&limit=1 > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Command: status
cmd_status() {
    print_header "System Status"
    
    # Check Docker
    echo -n "Docker: "
    if docker ps > /dev/null 2>&1; then
        print_success "Running"
    else
        print_error "Not running"
    fi
    
    # Check PostgreSQL
    echo -n "PostgreSQL: "
    if docker ps | grep postgres > /dev/null 2>&1; then
        print_success "Running on port 5432"
    else
        print_error "Not running"
    fi
    
    # Check Application
    echo -n "Application: "
    if check_app; then
        print_success "Running on http://localhost:3000"
    else
        print_error "Not running"
    fi
    
    echo ""
}

# Command: quick-test
cmd_quick_test() {
    print_header "Quick API Test"
    
    if ! check_app; then
        print_error "Application is not running!"
        print_info "Start it with: make dev"
        exit 1
    fi
    
    # Test 1: List Doctors
    echo -n "📋 Testing GET /doctors... "
    RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/doctors?page=1&limit=1)
    HTTP_CODE="${RESPONSE: -3}"
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "OK (200)"
    else
        print_error "Failed ($HTTP_CODE)"
    fi
    
    # Test 2: Get Doctor Availability
    echo -n "📅 Testing GET /doctors/{id}/availability... "
    RESPONSE=$(curl -s -w "%{http_code}" "http://localhost:3000/doctors/doctor-seed-001/availability?start_date=2025-10-07&end_date=2025-10-14")
    HTTP_CODE="${RESPONSE: -3}"
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "OK (200)"
    else
        print_error "Failed ($HTTP_CODE)"
    fi
    
    # Test 3: List Appointments
    echo -n "📋 Testing GET /appointments... "
    RESPONSE=$(curl -s -w "%{http_code}" http://localhost:3000/appointments?page=1&limit=1)
    HTTP_CODE="${RESPONSE: -3}"
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "OK (200)"
    else
        print_error "Failed ($HTTP_CODE)"
    fi
    
    # Test 4: Book Appointment (Idempotency)
    echo -n "📝 Testing POST /appointments (Idempotency)... "
    IDEMPOTENCY_KEY="test-$(date +%s)"
    RESPONSE1=$(curl -s -X POST "http://localhost:3000/appointments" \
        -H "Content-Type: application/json" \
        -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
        -d '{"slotId":"slot-doctor-seed-001-5-15-0","patientId":"patient-seed-001","notes":"CLI test"}')
    
    RESPONSE2=$(curl -s -X POST "http://localhost:3000/appointments" \
        -H "Content-Type: application/json" \
        -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
        -d '{"slotId":"slot-doctor-seed-001-5-15-0","patientId":"patient-seed-001","notes":"CLI test"}')
    
    if [ "$RESPONSE1" = "$RESPONSE2" ]; then
        print_success "OK (Idempotent)"
    else
        print_warning "Responses differ"
    fi
    
    echo ""
    print_success "Quick test completed!"
}

# Command: show-stats
cmd_show_stats() {
    print_header "Database Statistics"
    
    if ! check_app; then
        print_error "Application is not running!"
        exit 1
    fi
    
    # Get doctors count
    DOCTORS=$(curl -s "http://localhost:3000/doctors?page=1&limit=100" | jq -r '.data | length')
    echo "👨‍⚕️  Doctors: $DOCTORS"
    
    # Get appointments count
    APPOINTMENTS=$(curl -s "http://localhost:3000/appointments?page=1&limit=1" | jq -r '.pagination.total')
    echo "📅 Appointments: $APPOINTMENTS"
    
    # Get available slots for one doctor
    AVAILABLE=$(curl -s "http://localhost:3000/doctors/doctor-seed-001/availability?start_date=2025-10-07&end_date=2025-10-14" | jq -r '.data.summary.availableSlots')
    echo "🕒 Available Slots (next 7 days): $AVAILABLE"
    
    echo ""
}

# Command: load-report
cmd_load_report() {
    print_header "Load Test Report"
    
    if [ ! -f "test/load/results/full-load-test.json" ]; then
        print_error "Load test results not found!"
        print_info "Run load test with: make test-load"
        exit 1
    fi
    
    node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync('test/load/results/full-load-test.json'));
    
    console.log('📊 Load Test Summary\n');
    console.log('Total Requests:', data.aggregate.counters['http.requests']);
    console.log('Successful:', data.aggregate.counters['http.codes.200'] || 0);
    console.log('Failed:', (data.aggregate.counters['http.codes.400'] || 0) + (data.aggregate.counters['http.codes.500'] || 0));
    console.log('Success Rate:', (((data.aggregate.counters['http.codes.200'] || 0) / data.aggregate.counters['http.requests']) * 100).toFixed(2) + '%');
    console.log('');
    console.log('⏱️  Response Times:');
    console.log('  Min:', data.aggregate.summaries['http.response_time'].min + 'ms');
    console.log('  Max:', data.aggregate.summaries['http.response_time'].max + 'ms');
    console.log('  Median:', data.aggregate.summaries['http.response_time'].median + 'ms');
    console.log('  P95:', data.aggregate.summaries['http.response_time'].p95 + 'ms');
    console.log('  P99:', data.aggregate.summaries['http.response_time'].p99 + 'ms');
    "
    
    echo ""
}

# Command: help
cmd_help() {
    print_header "CLI Utility - Available Commands"
    echo ""
    echo "Usage: ./scripts/cli.sh <command>"
    echo ""
    echo "Commands:"
    echo "  status        - Check system status (Docker, DB, App)"
    echo "  quick-test    - Run quick API tests"
    echo "  show-stats    - Show database statistics"
    echo "  load-report   - Show load test report"
    echo "  help          - Show this help message"
    echo ""
}

# Main
case "${1:-help}" in
    status)
        cmd_status
        ;;
    quick-test)
        cmd_quick_test
        ;;
    show-stats)
        cmd_show_stats
        ;;
    load-report)
        cmd_load_report
        ;;
    help)
        cmd_help
        ;;
    *)
        print_error "Unknown command: $1"
        cmd_help
        exit 1
        ;;
esac
