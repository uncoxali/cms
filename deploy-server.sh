#!/bin/bash

# Configuration
SERVER_IP="91.107.255.10"
SERVER_USER="root"
REPO_URL="https://github.com/uncoxali/cms.git"
APP_DIR="/var/www/cms"

echo "🚀 Starting Deployment Process for $SERVER_IP..."

# 1. Update system and install dependencies
ssh $SERVER_USER@$SERVER_IP << EOF
    echo "📦 Installing system dependencies..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get update
    apt-get install -y nodejs git mariadb-server pm2 -y || npm install -g pm2

    # 2. Setup Database (MariaDB/MySQL)
    echo "🗄️ Setting up MariaDB..."
    systemctl start mariadb
    systemctl enable mariadb
    mysql -e "CREATE DATABASE IF NOT EXISTS nexdirect;"
    mysql -e "CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY '7WLggPn7xnRp';"
    mysql -e "GRANT ALL PRIVILEGES ON nexdirect.* TO 'admin'@'localhost';"
    mysql -e "FLUSH PRIVILEGES;"

    # 3. Clone/Update Repo
    if [ ! -d "$APP_DIR" ]; then
        echo "📂 Cloning repository..."
        git clone $REPO_URL $APP_DIR
    else
        echo "🔄 Updating repository..."
        cd $APP_DIR && git pull
    fi

    # 4. Install & Build Backend
    echo "⚙️ Setting up Backend..."
    cd $APP_DIR/server
    npm install
    
    # Create .env if not exists
    if [ ! -f ".env" ]; then
        cat << EOT > .env
PORT=3001
JWT_SECRET=$(openssl rand -base64 32)
DB_CLIENT=mysql2
DB_HOST=localhost
DB_USER=admin
DB_PASSWORD=7WLggPn7xnRp
DB_NAME=nexdirect
CORS_ORIGIN=*
EOT
    fi

    # Start with PM2
    echo "🏃 Starting Backend with PM2..."
    pm2 delete nex-backend || true
    pm2 start src/index.ts --name nex-backend --interpreter=npx -- tsx

    # 5. Install & Build Frontend
    echo "🎨 Setting up Frontend..."
    cd $APP_DIR
    npm install
    
    # Create .env.local for frontend
    cat << EOT > .env.local
NEXT_PUBLIC_API_URL=http://$SERVER_IP:3001/api
EOT

    # Build and Start
    # npm run build # Optional: for production build
    pm2 delete nex-frontend || true
    pm2 start npm --name nex-frontend -- run dev

    pm2 save
    echo "✅ Deployment Successful!"
EOF
