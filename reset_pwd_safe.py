import paramiko

def upload_and_run():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('91.107.255.10', username='root', password='7WLggPn7xnRp')
    
    # Hash for 'admin'
    hashed = "$2b$10$mJY/45f1QMJtLB4ZM2WO7eyxAFyg4l4vjq7ySjQHuWpk3erqQ.OZy"
    sql = f"UPDATE neurofy_users SET password_hash = '{hashed}' WHERE id = 'admin';"
    
    with open('/tmp/reset.sql', 'w') as f:
        f.write(sql)
        
    sftp = ssh.open_sftp()
    sftp.put('/tmp/reset.sql', '/root/reset.sql')
    sftp.close()
    
    stdin, stdout, stderr = ssh.exec_command('mysql nexdirect < /root/reset.sql')
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # Verify
    stdin, stdout, stderr = ssh.exec_command('mysql nexdirect -e "SELECT email, password_hash FROM neurofy_users WHERE id=\'admin\';"')
    print("DB State:")
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    upload_and_run()
