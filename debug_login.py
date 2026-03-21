import paramiko
import time

hostname = "91.107.255.10"
username = "root"
password = "7WLggPn7xnRp"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname, username=username, password=password)

# 1. Trigger Login via curl on the remote machine itself
print("Triggering login via curl on remote...")
login_cmd = 'curl -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d \'{"email":"admin@example.com", "password":"password"}\''
stdin, stdout, stderr = client.exec_command(login_cmd)
print(f"Response: {stdout.read().decode()}")

# 2. Check Logs
time.sleep(1)
stdin, stdout, stderr = client.exec_command("tail -n 50 /root/.pm2/logs/nex-backend-out.log")
print("\n--- Remote Out Logs ---")
print(stdout.read().decode())

stdin, stdout, stderr = client.exec_command("tail -n 50 /root/.pm2/logs/nex-backend-err.log")
print("\n--- Remote Err Logs ---")
print(stdout.read().decode())

client.close()
