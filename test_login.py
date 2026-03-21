import paramiko
import time

hostname = "91.107.255.10"
username = "root"
password = "7WLggPn7xnRp"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname, username=username, password=password)

def try_login(email, password):
    print(f"Trying login for {email}...")
    cmd = f"curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{{\"email\":\"{email}\", \"password\":\"{password}\"}}'"
    stdin, stdout, stderr = client.exec_command(cmd)
    print(f"Response: {stdout.read().decode()}")

try_login("admin@example.com", "wrongpassword")
try_login("nonexistent@example.com", "any")

client.close()
