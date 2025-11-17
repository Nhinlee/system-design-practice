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
	@echo "🌊 Digital Ocean Deployment:"
	@echo "  make docker-build              - Build Docker image"
	@echo "  make docker-build-tag TAG=v1.0 - Build with version tag"
	@echo "  make docker-push-do            - Push to DO registry"
	@echo "  make deploy-prepare            - Prepare deployment"
	@echo "  make deploy-do                 - Deploy to DO App Platform"
	@echo "  make deploy-droplet            - Deploy to DO Droplet"
	@echo "  make deploy-full               - Full deployment pipeline"
	@echo "  make logs-do                   - View app logs"
	@echo "  make status-do                 - Check deployment status"
	@echo ""
	@echo "📖 For detailed deployment info, see: docs/DEPLOYMENT.md"
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
	@echo ""
	@echo "⚠️  NOTE: For best results, reset database first:"
	@echo "   make db-reset && make test-load"
	@echo ""
	@mkdir -p test/load/results
	k6 run --out json=test/load/results/k6-load-test.json test/load/k6-load-test.js

test-load-fresh: db-reset test-load
	@echo "✅ Load test completed with fresh database!"

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

# ========================================
# 🌊 DIGITAL OCEAN DEPLOYMENT
# ========================================

# Build Docker image
docker-build:
	@echo "🐳 Building Docker image..."
	docker build -t clinic-appointment-system:latest -f Dockerfile .

# Build with version tag
docker-build-tag:
	@if [ -z "$(TAG)" ]; then \
		echo "❌ Error: TAG is required. Usage: make docker-build-tag TAG=v1.0.0"; \
		exit 1; \
	fi
	@echo "🐳 Building Docker image with tag: $(TAG)..."
	docker build -t clinic-appointment-system:$(TAG) -t clinic-appointment-system:latest -f Dockerfile .

# Test Docker image locally
docker-test:
	@echo "🧪 Testing Docker image locally..."
	docker run --rm -p 3000:3000 --env-file .env.production clinic-appointment-system:latest

# Push to Digital Ocean Container Registry
# Prerequisites: doctl auth init, doctl registry login
docker-push-do:
	@if [ -z "$(REGISTRY)" ]; then \
		echo "❌ Error: REGISTRY is required. Usage: make docker-push-do REGISTRY=registry.digitalocean.com/your-registry"; \
		exit 1; \
	fi
	@echo "📤 Tagging image for Digital Ocean..."
	docker tag clinic-appointment-system:latest $(REGISTRY)/clinic-appointment-system:latest
	@if [ -n "$(TAG)" ]; then \
		docker tag clinic-appointment-system:latest $(REGISTRY)/clinic-appointment-system:$(TAG); \
	fi
	@echo "📤 Pushing to Digital Ocean Container Registry..."
	docker push $(REGISTRY)/clinic-appointment-system:latest
	@if [ -n "$(TAG)" ]; then \
		docker push $(REGISTRY)/clinic-appointment-system:$(TAG); \
	fi

# Full build and push workflow
deploy-prepare:
	@echo "🚀 Preparing deployment to Digital Ocean..."
	@$(MAKE) docker-build
	@if [ -z "$(REGISTRY)" ]; then \
		echo "⚠️  Warning: REGISTRY not set. Set it with REGISTRY=registry.digitalocean.com/your-registry"; \
	else \
		$(MAKE) docker-push-do REGISTRY=$(REGISTRY) TAG=$(TAG); \
	fi

# Deploy to Digital Ocean using doctl
deploy-do:
	@if [ -z "$(APP_NAME)" ]; then \
		echo "❌ Error: APP_NAME is required. Usage: make deploy-do APP_NAME=clinic-appointment-system"; \
		exit 1; \
	fi
	@echo "🚀 Deploying to Digital Ocean App Platform..."
	@echo "📋 Make sure your app spec is configured in .do/app.yaml"
	doctl apps update $(APP_NAME) --spec .do/app.yaml

# SSH into Digital Ocean droplet
ssh-do:
	@if [ -z "$(DROPLET_IP)" ]; then \
		echo "❌ Error: DROPLET_IP is required. Usage: make ssh-do DROPLET_IP=your.droplet.ip"; \
		exit 1; \
	fi
	@echo "🔐 Connecting to Digital Ocean droplet..."
	ssh root@$(DROPLET_IP)

# Deploy to DO Droplet via SSH (manual deployment)
deploy-droplet:
	@if [ -z "$(DROPLET_IP)" ]; then \
		echo "❌ Error: DROPLET_IP is required. Usage: make deploy-droplet DROPLET_IP=your.droplet.ip"; \
		exit 1; \
	fi
	@echo "🚀 Deploying to Digital Ocean Droplet..."
	@echo "📦 Building Docker image..."
	@$(MAKE) docker-build
	@echo "💾 Saving Docker image..."
	docker save clinic-appointment-system:latest | gzip > clinic-app.tar.gz
	@echo "📤 Uploading to droplet..."
	scp clinic-app.tar.gz root@$(DROPLET_IP):/tmp/
	scp docker-compose.prod.yml root@$(DROPLET_IP):/root/clinic-appointment/docker-compose.yml
	scp .env.production root@$(DROPLET_IP):/root/clinic-appointment/.env
	@echo "🚀 Deploying on droplet..."
	ssh root@$(DROPLET_IP) '\
		cd /root/clinic-appointment && \
		docker load < /tmp/clinic-app.tar.gz && \
		docker-compose down && \
		docker-compose up -d && \
		rm /tmp/clinic-app.tar.gz'
	@rm clinic-app.tar.gz
	@echo "✅ Deployment complete!"

# One-command full deployment
deploy-full:
	@echo "🚀 Full deployment pipeline starting..."
	@$(MAKE) check
	@$(MAKE) docker-build-tag TAG=$(TAG)
	@if [ -n "$(REGISTRY)" ]; then \
		$(MAKE) docker-push-do REGISTRY=$(REGISTRY) TAG=$(TAG); \
	else \
		echo "⚠️  REGISTRY not set, skipping push to container registry"; \
	fi
	@echo "✅ Deployment preparation complete!"

# View deployment logs
logs-do:
	@if [ -z "$(APP_NAME)" ]; then \
		echo "❌ Error: APP_NAME is required. Usage: make logs-do APP_NAME=clinic-appointment-system"; \
		exit 1; \
	fi
	doctl apps logs $(APP_NAME) --follow

# Check deployment status
status-do:
	@if [ -z "$(APP_NAME)" ]; then \
		echo "❌ Error: APP_NAME is required. Usage: make status-do APP_NAME=clinic-appointment-system"; \
		exit 1; \
	fi
	doctl apps get $(APP_NAME)

# Rollback deployment
rollback-do:
	@if [ -z "$(APP_NAME)" ] || [ -z "$(DEPLOYMENT_ID)" ]; then \
		echo "❌ Error: APP_NAME and DEPLOYMENT_ID are required."; \
		echo "Usage: make rollback-do APP_NAME=clinic-app DEPLOYMENT_ID=abc123"; \
		exit 1; \
	fi
	doctl apps update $(APP_NAME) --deployment-id $(DEPLOYMENT_ID)

