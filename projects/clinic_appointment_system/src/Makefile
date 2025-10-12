# Clinic Appointment System - Makefile
# Convenient commands for development, testing, and deployment

.PHONY: help install dev build test clean docker db

# Default target
help:
	@echo "📋 Clinic Appointment System - Available Commands"
	@echo ""
	@echo "🚀 Development:"
	@echo "  make install          - Install dependencies"
	@echo "  make dev              - Start development server"
	@echo "  make build            - Build production bundle"
	@echo "  make lint             - Run ESLint"
	@echo "  make format           - Format code with Prettier"
	@echo ""
	@echo "🐳 Docker:"
	@echo "  make docker-up        - Start all Docker services (PostgreSQL, pgAdmin)"
	@echo "  make docker-down      - Stop all Docker services"
	@echo "  make docker-logs      - View Docker logs"
	@echo "  make docker-restart   - Restart Docker services"
	@echo ""
	@echo "🗄️  Database:"
	@echo "  make db-migrate       - Run Prisma migrations"
	@echo "  make db-seed          - Seed database with test data"
	@echo "  make db-reset         - Reset database (migrate + seed)"
	@echo "  make db-studio        - Open Prisma Studio"
	@echo "  make db-generate      - Generate Prisma client"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test             - Run all tests"
	@echo "  make test-unit        - Run unit tests"
	@echo "  make test-e2e         - Run E2E tests"
	@echo "  make test-cov         - Run tests with coverage"
	@echo "  make test-smoke       - Run smoke test (30s quick validation)"
	@echo "  make test-load        - Run full load test (8 minutes)"
	@echo "  make test-all         - Run all test suites"
	@echo ""
	@echo "📊 Reports:"
	@echo "  make report-smoke     - Generate smoke test report"
	@echo "  make report-load      - Generate load test report"
	@echo "  make report-coverage  - View test coverage report"
	@echo ""
	@echo "🧹 Cleanup:"
	@echo "  make clean            - Clean build artifacts"
	@echo "  make clean-all        - Clean everything (node_modules, dist, coverage)"
	@echo ""
	@echo "🛠️  Utilities:"
	@echo "  make status           - Check system status"
	@echo "  make quick-test       - Run quick API tests"
	@echo "  make stats            - Show database statistics"
	@echo "  make load-summary     - Show load test summary"
	@echo ""
	@echo "📦 Production:"
	@echo "  make prod-build       - Build for production"
	@echo "  make prod-start       - Start production server"
	@echo ""

# Installation
install:
	@echo "📦 Installing dependencies..."
	pnpm install

# Development
dev:
	@echo "🚀 Starting development server..."
	pnpm run start:dev

build:
	@echo "🔨 Building application..."
	pnpm run build

lint:
	@echo "🔍 Running ESLint..."
	pnpm run lint

format:
	@echo "✨ Formatting code..."
	pnpm run format

# Docker
docker-up:
	@echo "🐳 Starting Docker services..."
	cd .. && docker-compose up -d
	@echo "✅ Services started:"
	@echo "   - PostgreSQL: localhost:5432"
	@echo "   - pgAdmin: http://localhost:5050"

docker-down:
	@echo "🛑 Stopping Docker services..."
	cd .. && docker-compose down

docker-logs:
	@echo "📋 Viewing Docker logs..."
	cd .. && docker-compose logs -f

docker-restart: docker-down docker-up

# Database
db-migrate:
	@echo "🗄️  Running database migrations..."
	npx prisma migrate dev

db-seed:
	@echo "🌱 Seeding database..."
	pnpm run db:seed

db-reset:
	@echo "♻️  Resetting database..."
	npx prisma migrate reset --force
	pnpm run db:seed

db-studio:
	@echo "🎨 Opening Prisma Studio..."
	npx prisma studio

db-generate:
	@echo "⚙️  Generating Prisma client..."
	npx prisma generate

# Testing
test:
	@echo "🧪 Running all tests..."
	pnpm run test

test-unit:
	@echo "🧪 Running unit tests..."
	pnpm run test

test-e2e:
	@echo "🧪 Running E2E tests..."
	pnpm run test:e2e

test-cov:
	@echo "📊 Running tests with coverage..."
	pnpm run test:cov

test-smoke:
	@echo "💨 Running smoke test (30 seconds)..."
	@echo "⏱️  This will test the system with 10 VUs..."
	@mkdir -p test/load/results
	k6 run --out json=test/load/results/k6-smoke-test.json test/load/k6-smoke-test.js

test-load:
	@echo "🔥 Running full load test (8 minutes)..."
	@echo "⏱️  Phases: Warm-up → Ramp-up → Peak → Spike → Cool-down"
	@echo "📈 This will test up to 100 VUs..."
	@mkdir -p test/load/results
	k6 run --out json=test/load/results/k6-load-test.json test/load/k6-load-test.js

test-stress:
	@echo "💪 Running stress test (60 seconds)..."
	@echo "⚡ High-intensity test with 50 VUs..."
	@mkdir -p test/load/results
	k6 run --out json=test/load/results/k6-stress-test.json test/load/k6-stress-test.js

test-all: test-unit test-e2e test-smoke
	@echo "✅ All tests completed!"

# Reports
report-smoke:
	@echo "📊 Viewing smoke test report..."
	@if [ -f test/load/results/k6-smoke-test.html ]; then \
		echo "🌐 Opening HTML report..."; \
		open test/load/results/k6-smoke-test.html; \
	else \
		echo "❌ No HTML report found. Run: make test-smoke"; \
	fi

report-load:
	@echo "📊 Viewing load test report..."
	@if [ -f test/load/results/k6-load-test.html ]; then \
		echo "🌐 Opening HTML report..."; \
		open test/load/results/k6-load-test.html; \
	else \
		echo "❌ No HTML report found. Run: make test-load"; \
	fi

report-stress:
	@echo "📊 Viewing stress test report..."
	@if [ -f test/load/results/k6-stress-test.html ]; then \
		echo "🌐 Opening HTML report..."; \
		open test/load/results/k6-stress-test.html; \
	else \
		echo "❌ No HTML report found. Run: make test-stress"; \
	fi

report-coverage:
	@echo "📊 Opening coverage report..."
	open coverage/lcov-report/index.html || xdg-open coverage/lcov-report/index.html

# Cleanup
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist
	rm -rf coverage
	rm -rf test/load/results/*.json
	rm -rf test/load/results/*.html

clean-all: clean
	@echo "🧹 Cleaning everything..."
	rm -rf node_modules
	rm -rf pnpm-lock.yaml

# Production
prod-build: clean
	@echo "📦 Building for production..."
	pnpm run build

prod-start:
	@echo "🚀 Starting production server..."
	pnpm run start:prod

# Quick start for new developers
quickstart: install docker-up db-migrate db-seed
	@echo "✅ Quick start complete!"
	@echo "🚀 Run 'make dev' to start the development server"

# Production readiness check
check: lint test-unit test-e2e test-smoke
	@echo "✅ Production readiness check complete!"
	@echo "📊 All tests passed!"
	@echo "🚀 Ready for deployment!"

# Utility commands
status:
	@./scripts/cli.sh status

quick-test:
	@./scripts/cli.sh quick-test

stats:
	@./scripts/cli.sh show-stats

load-summary:
	@./scripts/cli.sh load-report
