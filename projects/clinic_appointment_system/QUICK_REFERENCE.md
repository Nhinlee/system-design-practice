# Quick Reference Card

## 🚀 Most Common Commands

### Getting Started
```bash
make quickstart          # First time setup (install + docker + db)
make dev                 # Start development server
./cli.js health          # Check system health
```

### Testing (Quick)
```bash
make test-smoke          # 30-second smoke test
npm run smoke            # Alternative using npm
./cli.js test:smoke      # Using CLI directly
```

### Testing (Full)
```bash
make test-load           # 8-minute comprehensive load test
./cli.js test:load       # Using CLI
./cli.js report:load     # View detailed results
```

### Database
```bash
make db-seed             # Add test data
make db-reset            # Fresh start (deletes all data!)
make db-studio           # Open database UI
```

### Docker
```bash
make docker-up           # Start PostgreSQL
make docker-down         # Stop services
make docker-logs         # View logs
```

---

## 📊 View Results

```bash
# After running tests
./cli.js report:smoke    # Smoke test report
./cli.js report:load     # Load test report
make report-coverage     # Open coverage in browser
```

---

## 🎯 Common Workflows

### Daily Development
```bash
make docker-up && make dev
```

### Before Commit
```bash
make lint && make test
```

### Load Testing
```bash
make test-smoke && ./cli.js report:smoke
```

### Full Quality Check
```bash
make check               # Runs lint + all tests
```

---

## ⚡ Custom Stress Tests

```bash
# Syntax: ./cli.js test:stress [duration-sec] [req-per-sec]
./cli.js test:stress 60 25     # Light load
./cli.js test:stress 120 50    # Medium load
./cli.js test:stress 180 100   # Heavy load
```

---

## 🆘 Troubleshooting

```bash
./cli.js health          # Diagnose issues
make docker-restart      # Fix Docker issues
make db-reset            # Fix database issues
make clean               # Fix build issues
```

---

## 📍 Important URLs

- App: http://localhost:3000
- Swagger: http://localhost:8080
- pgAdmin: http://localhost:5050
- Prisma Studio: `make db-studio`

---

## 💡 Tips

- Use `make help` to see all commands
- Use `./cli.js help` for CLI options
- Smoke test = quick validation (30s)
- Load test = full validation (8min)
- Always run `./cli.js health` first!
