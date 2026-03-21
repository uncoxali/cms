#!/bin/bash

# Configuration
SERVER_IP="91.107.255.10"
SERVER_USER="root"
REPO_URL="https://github.com/uncoxali/cms.git"
APP_DIR="/var/www/cms"

# SSH Key
SSH_KEY="/Users/alimohamadi/.ssh/id_ed25519"

echo "🚀 Starting Deployment Process for $SERVER_IP..."

# 0. Sync Local Repo to Server (using rsync to push changes)
echo "📂 Synchronizing local repository to server..."
rsync -avz -e "ssh -i $SSH_KEY" --exclude 'node_modules' --exclude '.git' --exclude 'server/node_modules' --exclude 'server/uploads' --exclude 'public/uploads' ./ $SERVER_USER@$SERVER_IP:$APP_DIR/

# 1. Update system and install dependencies
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << EOF
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
UPLOAD_DIR=\$APP_DIR/uploads
CORS_ORIGIN=*
EOT
    fi

    # Create uploads directory if not exists
    mkdir -p \$APP_DIR/uploads
    chmod 775 \$APP_DIR/uploads

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
