# GitHub Actions CI/CD Setup

This document explains the GitHub Actions workflows for automated testing and deployment.

## 📋 Workflows

### 1. CI Pipeline (`ci.yml`)

**Triggers:**
- Pull requests to `main`
- Pushes to `develop`

**Jobs:**

#### Lint
- Runs ESLint on codebase
- Ensures code quality standards

#### Test
- Sets up PostgreSQL database
- Runs unit tests with coverage
- Runs E2E tests
- Uploads coverage to Codecov

#### Build
- Builds Docker image
- Validates Dockerfile
- Uses caching for faster builds

#### Security
- Runs Trivy security scanner
- Checks for vulnerabilities in dependencies
- Uploads results to GitHub Security

---

### 2. Deploy Pipeline (`deploy.yml`)

**Triggers:**
- Pushes to `main` branch
- Manual workflow dispatch

**Jobs:**

#### Test
- Runs full test suite before deployment
- Must pass before deploying

#### Build and Push
- Builds Docker image
- Pushes to Digital Ocean Container Registry
- Tags with version, branch, and latest

#### Deploy
- Updates Digital Ocean App Platform
- Waits for deployment to complete
- Verifies health endpoint

#### Notify
- Reports deployment status
- Sends notifications (can be extended)

---

## 🔧 Setup Instructions

### Step 1: GitHub Secrets

Add these secrets in your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

```
DIGITALOCEAN_ACCESS_TOKEN  # Your DO API token
APP_ID                     # Digital Ocean App ID
APP_URL                    # Your app URL (e.g., https://clinic-app.ondigitalocean.app)
```

#### How to get these values:

**DIGITALOCEAN_ACCESS_TOKEN:**
1. Go to [Digital Ocean Dashboard](https://cloud.digitalocean.com)
2. API → Tokens/Keys → Generate New Token
3. Give it read/write access
4. Copy the token

**APP_ID:**
```bash
doctl apps list
# Copy the ID from your app
```

**APP_URL:**
- Your app's public URL
- Find in DO Dashboard → App Platform → Your App

---

### Step 2: Container Registry

Create a container registry on Digital Ocean:

1. Go to DO Dashboard → Container Registry
2. Click "Create"
3. Name it: `clinic-registry`
4. Choose a plan (Starter $5/month is enough)

Update registry name in `.github/workflows/deploy.yml`:
```yaml
env:
  REGISTRY: registry.digitalocean.com/clinic-registry
```

---

### Step 3: Enable Workflows

1. Push the `.github/workflows/` directory to your repository
2. Go to GitHub → Actions tab
3. Workflows should appear automatically

---

## 🚀 Usage

### Continuous Integration

Every pull request automatically:
1. ✅ Lints code
2. ✅ Runs tests with PostgreSQL
3. ✅ Builds Docker image
4. ✅ Scans for security vulnerabilities

**Example PR check:**
```
✓ Lint Code
✓ Run Tests (unit + e2e)
✓ Build Docker Image
✓ Security Scan
```

---

### Continuous Deployment

Every push to `main`:
1. ✅ Runs full test suite
2. ✅ Builds and tags Docker image
3. ✅ Pushes to DO Container Registry
4. ✅ Deploys to DO App Platform
5. ✅ Verifies health check
6. ✅ Notifies status

**Deployment flow:**
```
git push origin main
  ↓
GitHub Actions triggered
  ↓
Tests pass
  ↓
Docker image built & pushed
  ↓
App Platform updated
  ↓
Health check verified
  ↓
✅ Deployment complete!
```

---

## 🎯 Manual Deployment

You can also trigger deployments manually:

1. Go to GitHub → Actions
2. Select "Deploy to Digital Ocean"
3. Click "Run workflow"
4. Choose branch and environment
5. Click "Run workflow"

---

## 📊 Build Matrix (Optional Enhancement)

To test against multiple Node.js versions, update `ci.yml`:

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18.x, 20.x, 21.x]
    
    steps:
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
```

---

## 🔔 Notifications (Optional)

### Slack Notifications

Add to `deploy.yml`:

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment to production ${{ job.status }}'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
  if: always()
```

### Discord Notifications

```yaml
- name: Discord Notification
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    title: "Deployment Status"
    description: "Build and deploy to production"
```

---

## 🧪 Testing the Workflows Locally

### Using Act

Install [act](https://github.com/nektos/act) to run GitHub Actions locally:

```bash
# Install act
brew install act  # macOS

# Run CI workflow
act pull_request

# Run deploy workflow
act push -s DIGITALOCEAN_ACCESS_TOKEN=your-token
```

---

## 🔒 Security Best Practices

1. **Never commit secrets** to the repository
2. **Use GitHub Secrets** for all sensitive data
3. **Enable branch protection** on `main`:
   - Require pull request reviews
   - Require status checks to pass
   - Require branches to be up to date

4. **Review Dependabot alerts** regularly
5. **Keep actions up to date** with Dependabot

---

## 📈 Monitoring

### View Workflow Runs

1. Go to GitHub → Actions
2. See all workflow runs with status
3. Click on a run to see details
4. View logs for each job

### Deployment History

```bash
# View deployments
doctl apps list-deployments <app-id>

# View specific deployment
doctl apps get-deployment <app-id> <deployment-id>
```

---

## 🐛 Troubleshooting

### Workflow Failed at Test Stage

```bash
# Check test logs in GitHub Actions
# Run tests locally:
cd src
pnpm install
pnpm test
```

### Docker Build Failed

```bash
# Test Docker build locally:
docker build -f Dockerfile -t test .

# Check Dockerfile syntax
docker build --dry-run -f Dockerfile .
```

### Deployment Failed

```bash
# Check DO logs:
doctl apps logs <app-id> --follow

# Verify health endpoint:
curl https://your-app-url.com/health

# Check deployment status:
doctl apps get <app-id>
```

### Authentication Issues

```bash
# Test DO token:
doctl auth list

# Re-authenticate:
doctl auth init

# Verify registry access:
doctl registry login
```

---

## 🔄 Rollback

If deployment fails, rollback via GitHub Actions:

1. Go to Actions → Failed Deployment
2. Find the last successful deployment ID
3. Update secret `DEPLOYMENT_ID` with previous version
4. Manually trigger rollback workflow

Or use doctl:

```bash
doctl apps list-deployments <app-id>
doctl apps update <app-id> --deployment-id <previous-deployment-id>
```

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Digital Ocean App Platform API](https://docs.digitalocean.com/reference/api/api-reference/#tag/Apps)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [DigitalOcean Action](https://github.com/digitalocean/action-doctl)

---

## ✅ Checklist

- [ ] GitHub secrets configured
- [ ] Container registry created
- [ ] Workflows committed to repository
- [ ] Branch protection enabled on `main`
- [ ] First deployment tested
- [ ] Health check endpoint working
- [ ] Rollback procedure tested
- [ ] Team notified of CI/CD setup

---

**Your CI/CD pipeline is ready! 🚀**

Every push to `main` will automatically test, build, and deploy your application.
