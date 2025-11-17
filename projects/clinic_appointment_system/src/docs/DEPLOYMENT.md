# Digital Ocean Deployment Guide

This guide covers deploying the Clinic Appointment System to Digital Ocean using three different approaches.

## 📋 Prerequisites

1. **Digital Ocean Account**: Sign up at [digitalocean.com](https://digitalocean.com)
2. **doctl CLI** (for App Platform): Install from [doctl documentation](https://docs.digitalocean.com/reference/doctl/how-to/install/)
3. **Docker**: For local image building
4. **SSH Key**: For Droplet access

## 🚀 Deployment Options

### Option 1: App Platform (PaaS) - Recommended for Beginners

**Pros**: Fully managed, auto-scaling, zero-ops
**Cons**: Higher cost, less control

#### Setup Steps:

1. **Authenticate doctl**:
```bash
doctl auth init
```

2. **Create App from spec**:
```bash
cd src
doctl apps create --spec .do/app.yaml
```

3. **Set environment secrets** in DO Dashboard:
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - Update `ALLOWED_ORIGINS` with your domain

4. **Deploy**:
```bash
make deploy-do APP_NAME=clinic-appointment-system
```

5. **Monitor**:
```bash
make logs-do APP_NAME=clinic-appointment-system
make status-do APP_NAME=clinic-appointment-system
```

---

### Option 2: Container Registry + Droplet (Balanced)

**Pros**: Cost-effective, flexible, good control
**Cons**: Requires some DevOps knowledge

#### Setup Steps:

1. **Create Container Registry**:
   - Go to DO Dashboard → Container Registry
   - Create a registry (e.g., `clinic-registry`)

2. **Authenticate Docker**:
```bash
doctl registry login
```

3. **Build and Push Image**:
```bash
cd src

# Build with version tag
make docker-build-tag TAG=v1.0.0

# Push to DO registry
make docker-push-do REGISTRY=registry.digitalocean.com/clinic-registry TAG=v1.0.0
```

4. **Create a Droplet**:
   - Size: Basic - $12/month (2GB RAM, 1 vCPU)
   - Image: Ubuntu 22.04 LTS
   - Add your SSH key

5. **Setup Droplet**:
```bash
# Upload setup script
scp .do/droplet-setup.sh root@YOUR_DROPLET_IP:/tmp/
ssh root@YOUR_DROPLET_IP "bash /tmp/droplet-setup.sh"
```

6. **Deploy**:
```bash
# Pull and run from container registry
ssh root@YOUR_DROPLET_IP
docker login registry.digitalocean.com
docker pull registry.digitalocean.com/clinic-registry/clinic-appointment-system:v1.0.0
docker-compose up -d
```

---

### Option 3: Direct Droplet Deployment (Full Control)

**Pros**: Maximum control, most cost-effective
**Cons**: Manual setup and maintenance

#### Setup Steps:

1. **Create and Setup Droplet** (same as Option 2)

2. **Deploy Application**:
```bash
cd src

# One command deployment
make deploy-droplet DROPLET_IP=YOUR_DROPLET_IP
```

This will:
- Build Docker image locally
- Transfer image to droplet
- Deploy with docker-compose
- Run database migrations

3. **Configure Environment**:
```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Edit production environment
cd /root/clinic-appointment
nano .env

# Update with production values:
# - DATABASE_URL (from DO Managed Database or local postgres)
# - JWT_SECRET
# - ALLOWED_ORIGINS
```

4. **Setup SSL (Optional but Recommended)**:
```bash
# After configuring your domain DNS to point to droplet
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🗄️ Database Options

### Option A: Digital Ocean Managed Database (Recommended)

**Pros**: Automatic backups, scaling, maintenance
**Cost**: ~$15/month for smallest plan

1. Create Managed PostgreSQL in DO Dashboard
2. Get connection string from dashboard
3. Update `DATABASE_URL` in production environment
4. Add trusted source (your app's IP or VPC)

### Option B: PostgreSQL on Same Droplet

**Pros**: Free (included in droplet cost)
**Cons**: Manual backups and maintenance

Already configured in `docker-compose.prod.yml` - runs PostgreSQL as a container.

---

## 🔧 Makefile Commands Reference

### Building
```bash
make docker-build                    # Build Docker image
make docker-build-tag TAG=v1.0.0    # Build with version tag
make docker-test                     # Test image locally
```

### Deploying
```bash
make deploy-prepare REGISTRY=registry.digitalocean.com/your-registry
make deploy-do APP_NAME=clinic-app
make deploy-droplet DROPLET_IP=your.ip.address
make deploy-full TAG=v1.0.0 REGISTRY=registry.digitalocean.com/your-registry
```

### Managing
```bash
make ssh-do DROPLET_IP=your.ip.address
make logs-do APP_NAME=clinic-app
make status-do APP_NAME=clinic-app
make rollback-do APP_NAME=clinic-app DEPLOYMENT_ID=abc123
```

---

## 📊 Cost Comparison

| Option | App + DB | Monthly Cost |
|--------|----------|--------------|
| App Platform | Basic + Managed DB | ~$30-40 |
| Droplet + Managed DB | 2GB + Basic DB | ~$27 |
| Droplet Only | 2GB (app + db) | ~$12 |

---

## 🔒 Security Checklist

- [ ] Generate strong `JWT_SECRET` (use `openssl rand -base64 32`)
- [ ] Enable SSL/TLS (use Certbot)
- [ ] Configure firewall (UFW on droplet)
- [ ] Use environment variables for secrets (never commit `.env.production`)
- [ ] Enable DO managed database backups
- [ ] Set up monitoring and alerts
- [ ] Configure proper CORS origins
- [ ] Use non-root database user
- [ ] Enable database SSL mode

---

## 🔄 CI/CD Setup (Optional)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Digital Ocean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install doctl
        uses: digitalocean/action-doctl@v2
        with:
          token: ${{ secrets.DIGITALOCEAN_ACCESS_TOKEN }}
      
      - name: Build and push to DO registry
        run: |
          cd src
          docker build -t clinic-app:${{ github.sha }} .
          doctl registry login
          docker tag clinic-app:${{ github.sha }} registry.digitalocean.com/your-registry/clinic-app:latest
          docker push registry.digitalocean.com/your-registry/clinic-app:latest
      
      - name: Deploy to App Platform
        run: |
          doctl apps update ${{ secrets.APP_ID }} --spec .do/app.yaml
```

---

## 🆘 Troubleshooting

### Container won't start
```bash
# Check logs
docker logs clinic_appointment_app

# Check environment variables
docker exec clinic_appointment_app env

# Verify database connection
docker exec clinic_appointment_app node -e "console.log(process.env.DATABASE_URL)"
```

### Database connection issues
```bash
# Test from app container
docker exec -it clinic_appointment_app sh
npm install -g pg
node -e "const {Client} = require('pg'); const c = new Client({connectionString: process.env.DATABASE_URL}); c.connect().then(() => console.log('Connected!')).catch(console.error)"
```

### SSL Certificate issues
```bash
# Renew certificate
certbot renew --dry-run
certbot renew
systemctl reload nginx
```

---

## 📚 Additional Resources

- [Digital Ocean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [Digital Ocean Droplets Guide](https://docs.digitalocean.com/products/droplets/)
- [doctl CLI Reference](https://docs.digitalocean.com/reference/doctl/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 📞 Support

If you encounter issues:
1. Check DO status page: [status.digitalocean.com](https://status.digitalocean.com)
2. Review application logs: `make logs-do APP_NAME=your-app`
3. Check health endpoint: `https://your-domain.com/health`
