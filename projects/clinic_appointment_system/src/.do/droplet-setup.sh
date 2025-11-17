#!/bin/bash
# Setup script for Digital Ocean Droplet
# Run this on your DO droplet after initial creation

set -e

echo "🚀 Setting up Clinic Appointment System on Digital Ocean Droplet"

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
echo "🐳 Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Start Docker
systemctl start docker
systemctl enable docker

# Create application directory
echo "📁 Creating application directory..."
mkdir -p /root/clinic-appointment
cd /root/clinic-appointment

# Install firewall and configure
echo "🔥 Configuring firewall..."
apt-get install -y ufw
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw --force enable

# Install Nginx (optional - for reverse proxy)
echo "📡 Installing Nginx..."
apt-get install -y nginx

# Create Nginx configuration
cat > /etc/nginx/sites-available/clinic-appointment << 'EOF'
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/clinic-appointment /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Install Certbot for SSL (optional)
echo "🔒 Installing Certbot for SSL..."
apt-get install -y certbot python3-certbot-nginx

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your application files to /root/clinic-appointment"
echo "2. Create .env file with production credentials"
echo "3. Run: cd /root/clinic-appointment && docker-compose up -d"
echo "4. Configure SSL: certbot --nginx -d your_domain.com"
echo ""
echo "🔧 Useful commands:"
echo "  docker-compose logs -f     - View logs"
echo "  docker-compose restart     - Restart services"
echo "  docker-compose down        - Stop services"
echo "  systemctl status nginx     - Check Nginx status"
