# Production Deployment Checklist

Use this checklist before deploying to production.

## 🔐 Security

- [ ] Generate strong JWT_SECRET using `openssl rand -base64 32`
- [ ] Update all secrets in `.env.production`
- [ ] Verify `.env.production` is in `.gitignore`
- [ ] Configure CORS with specific origins (no wildcards)
- [ ] Enable HTTPS/SSL certificates
- [ ] Review and update allowed origins
- [ ] Set up firewall rules on droplet/VPC
- [ ] Use managed database with SSL enabled
- [ ] Create database user with limited permissions (not superuser)
- [ ] Enable database backups
- [ ] Set up rate limiting (if not using nginx)

## 🗄️ Database

- [ ] Create production database
- [ ] Configure connection string with SSL mode
- [ ] Run migrations: `pnpm prisma migrate deploy`
- [ ] Verify database connectivity
- [ ] Set up automated backups
- [ ] Configure retention policy
- [ ] Test database restore procedure

## 🐳 Docker & Infrastructure

- [ ] Build Docker image: `make docker-build`
- [ ] Test image locally: `make docker-test`
- [ ] Push to container registry
- [ ] Verify health check endpoint works
- [ ] Configure resource limits (CPU, memory)
- [ ] Set up monitoring and alerts
- [ ] Configure log aggregation

## 🧪 Testing

- [ ] Run full test suite: `make test-all`
- [ ] Run smoke tests: `make test-smoke`
- [ ] Verify all E2E tests pass
- [ ] Test health endpoint: `curl http://localhost:3000/health`
- [ ] Verify API endpoints work correctly
- [ ] Load test with expected traffic

## 📊 Monitoring & Logging

- [ ] Set up application monitoring (DO Monitoring, DataDog, etc.)
- [ ] Configure log level to 'info' or 'warn'
- [ ] Set up alerts for:
  - High error rates
  - High response times
  - High CPU/memory usage
  - Database connection issues
- [ ] Create dashboard for key metrics

## 🚀 Deployment

- [ ] Review deployment documentation
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window (if needed)
- [ ] Notify team of deployment
- [ ] Deploy to staging first (if available)
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Verify deployment: `make status-do APP_NAME=your-app`
- [ ] Check application logs: `make logs-do APP_NAME=your-app`
- [ ] Test critical user journeys
- [ ] Monitor error rates for 30 minutes

## 📝 Documentation

- [ ] Update API documentation
- [ ] Document deployment process
- [ ] Update environment variable documentation
- [ ] Create runbook for common issues
- [ ] Document rollback procedure

## 🔄 Post-Deployment

- [ ] Verify health check: `curl https://yourdomain.com/health`
- [ ] Test key API endpoints
- [ ] Check database connections
- [ ] Monitor logs for errors
- [ ] Verify metrics are being collected
- [ ] Test alerting system
- [ ] Communicate deployment success to team

## 🆘 Rollback Plan

If issues occur:

1. **Immediate rollback**:
   ```bash
   make rollback-do APP_NAME=your-app DEPLOYMENT_ID=previous-id
   ```

2. **Check logs**:
   ```bash
   make logs-do APP_NAME=your-app
   ```

3. **Verify rollback**:
   - Test health endpoint
   - Check key functionality
   - Monitor error rates

4. **Post-mortem**:
   - Document what went wrong
   - Update deployment checklist
   - Plan fixes for next deployment

---

## 📞 Emergency Contacts

- **Team Lead**: [Name/Contact]
- **DevOps**: [Name/Contact]
- **Database Admin**: [Name/Contact]
- **Digital Ocean Support**: support@digitalocean.com

---

## 🔗 Quick Links

- [DO Dashboard](https://cloud.digitalocean.com)
- [Container Registry](https://cloud.digitalocean.com/registry)
- [Monitoring](https://cloud.digitalocean.com/monitoring)
- [Database](https://cloud.digitalocean.com/databases)
