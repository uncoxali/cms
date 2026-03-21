import paramiko
import time

def deploy():
    hostname = "91.107.255.10"
    username = "root"
    password = "7WLggPn7xnRp"
    repo_url = "https://github.com/uncoxali/cms.git"
    app_dir = "/var/www/cms"

    print(f"🚀 Connecting to {hostname}...")
    
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname, username=username, password=password, timeout=30)
        print("✅ Connected!")

        commands = [
            # 1. Update and install Node.js
            "echo '📦 Installing system dependencies...'",
            "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
            "apt-get update",
            "apt-get install -y nodejs git mariadb-server -y",
            "npm install -g pm2 tsx",

            # 2. Setup MariaDB
            "echo '🗄️ Setting up MariaDB...'",
            "systemctl start mariadb || service mariadb start",
            "systemctl enable mariadb || true",
            "mysql -e \"CREATE DATABASE IF NOT EXISTS nexdirect;\"",
            "mysql -e \"CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY '7WLggPn7xnRp';\"",
            "mysql -e \"GRANT ALL PRIVILEGES ON nexdirect.* TO 'admin'@'localhost';\"",
            "mysql -e \"FLUSH PRIVILEGES;\"",

            # 3. Clone/Update Repo
            f"if [ ! -d '{app_dir}' ]; then git clone {repo_url} {app_dir}; else cd {app_dir} && git pull; fi",

            # 4. Setup Backend
            f"cd {app_dir}/server && npm install",
            f"cd {app_dir}/server && printf 'PORT=3001\\nJWT_SECRET=supersecret\\nDB_CLIENT=mysql2\\nDB_HOST=localhost\\nDB_USER=admin\\nDB_PASSWORD=7WLggPn7xnRp\\nDB_NAME=nexdirect\\nCORS_ORIGIN=*' > .env",
            
            # Start Backend
            f"pm2 delete nex-backend || true",
            f"cd {app_dir}/server && pm2 start src/index.ts --name nex-backend --interpreter=npx -- tsx",

            # 5. Setup Frontend
            f"cd {app_dir} && npm install",
            f"cd {app_dir} && printf 'NEXT_PUBLIC_API_URL=http://{hostname}:3001/api' > .env.local",
            
            # Start Frontend
            f"pm2 delete nex-frontend || true",
            f"cd {app_dir} && pm2 start npm --name nex-frontend -- run dev",

            "pm2 save"
        ]

        for cmd in commands:
            print(f"🏃 Executing: {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            # Wait for command to finish and print output
            exit_status = stdout.channel.recv_exit_status()
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            if out: print(f"OUT: {out}")
            if err: print(f"ERR: {err}")
            if exit_status != 0:
                print(f"❌ Command failed with status {exit_status}")
                # Don't strictly stop unless it's critical

        print("🎉 Deployment Complete!")

    except Exception as e:
        print(f"❌ Error during deployment: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    deploy()
