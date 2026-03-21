import paramiko
hostname = "91.107.255.10"
username = "root"
password = "7WLggPn7xnRp"
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname, username=username, password=password)
stdin, stdout, stderr = client.exec_command("pm2 status && pm2 logs nex-backend --lines 20 --nostream")
print(stdout.read().decode())
print(stderr.read().decode())
client.close()
