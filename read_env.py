import paramiko
hostname = "91.107.255.10"
username = "root"
password = "7WLggPn7xnRp"
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(hostname, username=username, password=password)
stdin, stdout, stderr = client.exec_command("cat /var/www/cms/server/.env")
print(stdout.read().decode())
client.close()
