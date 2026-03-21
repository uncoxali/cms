import paramiko

def upload_and_run():
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect('91.107.255.10', username='root', password='7WLggPn7xnRp')
    
    # Hashes generated with bcryptjs
    admin_hash = "$2b$10$idaNQqq2d.XjlLP.Gwncb.dYXdRoWDrMkJ2G8PZhckThuAsVWqf6O"
    editor_hash = "$2b$10$T7NqJrk13GwHDoKKxxA.ueKb8QFHbMgykugYlBrv.Gjp37S08np1O"
    viewer_hash = "$2b$10$c5zHtSvFKc86slLhONhxo.Sge7CuLuwDuMvhxu8UlMFAzzk3XlRD6"
    
    sql = f"""
    UPDATE neurofy_users SET password_hash = '{admin_hash}' WHERE id = 'admin';
    INSERT IGNORE INTO neurofy_users (id, email, password_hash, first_name, last_name, role, status)
    VALUES ('editor', 'editor@example.com', '{editor_hash}', 'Editor', 'User', 'role_editor', 'active');
    INSERT IGNORE INTO neurofy_users (id, email, password_hash, first_name, last_name, role, status)
    VALUES ('viewer', 'viewer@example.com', '{viewer_hash}', 'Viewer', 'User', 'role_viewer', 'active');
    """
    
    with open('/tmp/reset.sql', 'w') as f:
        f.write(sql)
        
    sftp = ssh.open_sftp()
    sftp.put('/tmp/reset.sql', '/root/reset.sql')
    sftp.close()
    
    stdin, stdout, stderr = ssh.exec_command('mysql nexdirect < /root/reset.sql')
    print(stdout.read().decode())
    print(stderr.read().decode())
    
    # Verify
    stdin, stdout, stderr = ssh.exec_command('mysql nexdirect -e "SELECT id, email, password_hash FROM neurofy_users;"')
    print("DB State:")
    print(stdout.read().decode())
    
    ssh.close()

if __name__ == "__main__":
    upload_and_run()
