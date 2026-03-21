import paramiko
import time

hostname = "91.107.255.10"
username = "root"
password = "7WLggPn7xnRp"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname, username=username, password=password)

print("Trying login with CORRECT password...")
cmd = "curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@example.com\", \"password\":\"admin123\"}'"
stdin, stdout, stderr = client.exec_command(cmd)
print(f"Response: {stdout.read().decode()}")

# Check Logs
time.sleep(1)
stdin, stdout, stderr = client.exec_command("tail -n 20 /root/.pm2/logs/nex-backend-out.log")
print("\n--- Remote Logs ---")
print(stdout.read().decode())

client.close()
