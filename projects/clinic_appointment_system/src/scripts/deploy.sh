#!/bin/bash

# Quick deployment script for Digital Ocean
# This script guides you through deploying to Digital Ocean

set -e

echo "🌊 Digital Ocean Deployment Assistant"
echo "======================================"
echo ""

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "⚠️  .env.production not found!"
    echo ""
    echo "Creating .env.production from template..."
    cp .env.example .env.production
    
    echo ""
    echo "🔐 Please configure the following in .env.production:"
    echo "  1. DATABASE_URL - Your production database connection string"
    echo "  2. JWT_SECRET - Generate with: openssl rand -base64 32"
    echo "  3. ALLOWED_ORIGINS - Your frontend domain(s)"
    echo ""
    read -p "Press Enter to edit .env.production now..."
    ${EDITOR:-nano} .env.production
fi

echo ""
echo "🎯 Select deployment method:"
echo "  1) App Platform (PaaS - Easy, managed)"
echo "  2) Container Registry + Droplet (Balanced)"
echo "  3) Direct Droplet Deployment (Full control)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo ""
        echo "📱 App Platform Deployment"
        echo "=========================="
        echo ""
        
        # Check if doctl is installed
        if ! command -v doctl &> /dev/null; then
            echo "❌ doctl is not installed!"
            echo "Install from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
            exit 1
        fi
        
        echo "1. Make sure you're authenticated: doctl auth init"
        echo "2. Update .do/app.yaml with your settings"
        echo "3. Create app: doctl apps create --spec .do/app.yaml"
        echo ""
        read -p "Continue? (y/n): " continue
        
        if [ "$continue" = "y" ]; then
            echo ""
            read -p "Enter your app name: " app_name
            doctl apps create --spec .do/app.yaml
        fi
        ;;
        
    2)
        echo ""
        echo "🐳 Container Registry Deployment"
        echo "================================"
        echo ""
        
        read -p "Enter your DO registry name (e.g., clinic-registry): " registry_name
        read -p "Enter version tag (e.g., v1.0.0): " tag
        
        echo ""
        echo "Building Docker image..."
        make docker-build-tag TAG=$tag
        
        echo ""
        echo "Pushing to Digital Ocean..."
        make docker-push-do REGISTRY=registry.digitalocean.com/$registry_name TAG=$tag
        
        echo ""
        echo "✅ Image pushed successfully!"
        echo ""
        echo "Next steps:"
        echo "1. Create a droplet on Digital Ocean"
        echo "2. SSH into droplet: ssh root@YOUR_DROPLET_IP"
        echo "3. Run setup script: bash <(curl -s URL_TO_droplet-setup.sh)"
        echo "4. Pull and run: docker pull registry.digitalocean.com/$registry_name/clinic-appointment-system:$tag"
        ;;
        
    3)
        echo ""
        echo "🖥️  Direct Droplet Deployment"
        echo "============================"
        echo ""
        
        read -p "Enter your droplet IP address: " droplet_ip
        
        echo ""
        echo "This will:"
        echo "  1. Build Docker image locally"
        echo "  2. Transfer to droplet"
        echo "  3. Deploy with docker-compose"
        echo ""
        read -p "Continue? (y/n): " continue
        
        if [ "$continue" = "y" ]; then
            make deploy-droplet DROPLET_IP=$droplet_ip
        fi
        ;;
        
    *)
        echo "Invalid choice!"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment process complete!"
echo ""
echo "📚 Documentation:"
echo "  - Full guide: docs/DEPLOYMENT.md"
echo "  - Checklist: docs/DEPLOYMENT_CHECKLIST.md"
echo ""
echo "🧪 Test your deployment:"
echo "  curl https://your-domain.com/health"
