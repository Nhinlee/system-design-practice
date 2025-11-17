# 🚀 Quick Start: Deploying to Digital Ocean

This guide will get you deploying to Digital Ocean in under 10 minutes.

## Prerequisites

- [ ] Digital Ocean account ([Sign up](https://digitalocean.com))
- [ ] Docker installed locally
- [ ] Production environment configured

## Option 1: Interactive Deployment (Easiest) ⭐

```bash
cd src
./scripts/deploy.sh
```

The script will guide you through the deployment process.

---

## Option 2: Manual Quick Deployment

### Step 1: Configure Environment

```bash
cd src

# Copy example environment
cp .env.example .env.production

# Generate JWT secret
openssl rand -base64 32

# Edit .env.production with your settings
nano .env.production
```

**Required settings in `.env.production`:**
- `DATABASE_URL` - Your production database connection
- `JWT_SECRET` - The secret you just generated
- `ALLOWED_ORIGINS` - Your frontend domain(s)

### Step 2: Choose Deployment Method

#### A) App Platform (Fully Managed - $30/month)

```bash
# Install doctl
brew install doctl  # macOS
# or download from https://docs.digitalocean.com/reference/doctl/

# Authenticate
doctl auth init

# Create app
doctl apps create --spec .do/app.yaml

# Get your app URL
doctl apps list
```

#### B) Droplet (Cost-Effective - $12/month)

```bash
# Build and deploy in one command
make deploy-droplet DROPLET_IP=YOUR_DROPLET_IP

# OR step by step:
# 1. Build image
make docker-build-tag TAG=v1.0.0

# 2. Setup droplet (first time only)
scp .do/droplet-setup.sh root@YOUR_DROPLET_IP:/tmp/
ssh root@YOUR_DROPLET_IP "bash /tmp/droplet-setup.sh"

# 3. Deploy
scp docker-compose.prod.yml root@YOUR_DROPLET_IP:/root/clinic-appointment/
scp .env.production root@YOUR_DROPLET_IP:/root/clinic-appointment/.env
ssh root@YOUR_DROPLET_IP "cd /root/clinic-appointment && docker-compose up -d"
```

### Step 3: Verify Deployment

```bash
# Test health endpoint
curl https://YOUR_DOMAIN/health

# Should return:
# {"status":"ok","timestamp":"2025-10-12T...","uptime":123}
```

---

## 🔍 Useful Commands

```bash
# Build Docker image
make docker-build

# Test locally
make docker-test

# View deployment logs (App Platform)
make logs-do APP_NAME=your-app

# Check deployment status
make status-do APP_NAME=your-app

# SSH into droplet
ssh root@YOUR_DROPLET_IP

# View logs on droplet
ssh root@YOUR_DROPLET_IP "cd /root/clinic-appointment && docker-compose logs -f"
```

---

## 📊 Cost Breakdown

| Service | Specification | Monthly Cost |
|---------|--------------|--------------|
| **App Platform (PaaS)** | 2 instances, managed | ~$30-40 |
| **Droplet + Managed DB** | 2GB RAM + PostgreSQL | ~$27 |
| **Droplet Only** | 2GB RAM (app + db in containers) | ~$12 |

---

## 🔒 Security Checklist

Before going live:

- [ ] Changed `JWT_SECRET` to a strong random value
- [ ] Configured `ALLOWED_ORIGINS` with actual domain (no `*`)
- [ ] Enabled SSL/HTTPS (Certbot or DO's automatic SSL)
- [ ] Configured firewall rules
- [ ] Set up database backups
- [ ] Reviewed and tested all endpoints
- [ ] Set up monitoring and alerts

---

## 🆘 Troubleshooting

### Container won't start

```bash
# Check logs
ssh root@YOUR_DROPLET_IP
docker logs clinic_appointment_app

# Check if port is already in use
lsof -i :3000
```

### Database connection failed

```bash
# Test database connection
docker exec -it clinic_appointment_app sh
node -e "console.log(process.env.DATABASE_URL)"

# Verify database is running
docker ps | grep postgres
```

### Health check failing

```bash
# Test health endpoint locally
docker exec clinic_appointment_app curl localhost:3000/health

# Check if app is listening
docker exec clinic_appointment_app netstat -tlnp
```

---

## 📚 Full Documentation

- **[Complete Deployment Guide](DEPLOYMENT.md)** - Detailed instructions for all deployment methods
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Pre-deployment checklist
- **[API Documentation](apis/INDEX.md)** - API reference

---

## 🎯 Next Steps After Deployment

1. **Set up monitoring** - Configure alerts in DO dashboard
2. **Configure domain** - Point your domain to the app
3. **Enable SSL** - Use Certbot or DO's managed certificates
4. **Set up CI/CD** - Automate deployments with GitHub Actions
5. **Configure backups** - Enable automatic database backups
6. **Load testing** - Run `make test-load` to verify performance

---

## 💡 Pro Tips

1. **Start small**: Begin with a basic droplet, scale up as needed
2. **Use managed database**: Worth the extra cost for automatic backups
3. **Enable monitoring**: Set up alerts before you need them
4. **Test rollback**: Practice rolling back before you have an emergency
5. **Document changes**: Keep a deployment log

---

## 🌟 Recommended Setup for Production

```
┌─────────────────────────────────────┐
│  Digital Ocean Setup                │
├─────────────────────────────────────┤
│                                     │
│  Load Balancer                      │
│       ↓                             │
│  App Platform (2 instances)         │
│       ↓                             │
│  Managed PostgreSQL Database        │
│       ↓                             │
│  Managed Redis (future caching)     │
│                                     │
│  + Container Registry               │
│  + Monitoring & Alerts              │
│  + Automated Backups                │
└─────────────────────────────────────┘

Estimated cost: ~$50-70/month
```

---

## 📞 Need Help?

- Review [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions
- Check [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for common issues
- Digital Ocean support: https://www.digitalocean.com/support/
- Community: https://www.digitalocean.com/community/

---

**Happy Deploying! 🚀**
