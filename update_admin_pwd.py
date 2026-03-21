import paramiko
import bcrypt

def update_password():
    password = b"admin"
    hashed = bcrypt.hashpw(password, bcrypt.gensalt(10)).decode()
    print(f"New hash: {hashed}")
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('91.107.255.10', username='root', password='7WLggPn7xnRp')
    
    cmd = f'mysql nexdirect -e "UPDATE neurofy_users SET password_hash = \'{hashed}\' WHERE id = \'admin\';"'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # Verify
    stdin, stdout, stderr = ssh.exec_command('mysql nexdirect -e "SELECT password_hash FROM neurofy_users WHERE id=\'admin\';"')
    print("Hash in DB after update:")
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    update_password()
