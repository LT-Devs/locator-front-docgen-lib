import paramiko
import os

# Настройки SSH
hostname = '10.17.1.216'
username = 'sa'
password = 'asd555ASD'

# Удаление содержимого в директории /home/sa/petitions
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname, username=username, password=password)
print("[INFO] Подключение к серверу SSH выполнено.")

ssh.exec_command("rm -rf /home/sa/release/petitions_release/*")
print("[INFO] Содержимое директории /home/sa/release/petitions_release удалено.")

# Проверка существования файла перед загрузкой
local_file = './transport.tar.gz'
remote_file = '/home/sa/release/transport.tar.gz'

if os.path.exists(local_file):
    # Копирование всех файлов из текущей папки в директорию /home/sa/petitions
    scp = paramiko.SFTPClient.from_transport(ssh.get_transport())
    scp.put(local_file, remote_file)
    print(f"[INFO] Файл {local_file} загружен на сервер.")
else:
    print(f"[ERROR] Файл {local_file} не найден.")

stdin, stdout, stderr = ssh.exec_command("cd /home/sa/release && tar xzvf transport.tar.gz")
print("[INFO] Ожидание вывода команды tar:")
print(stdout.read().decode())
print("[ERROR] Возникшие ошибки команды tar:")
print(stderr.read().decode())

stdin, stdout, stderr = ssh.exec_command("cd petitions_release && echo 'asd555ASD' | sudo -S docker load -i frontend_petition.tar && echo 'asd555ASD' | sudo -S  docker load -i backend_petition.tar && cd .. && echo 'asd555ASD' | sudo -S  docker compose down && echo 'asd555ASD' | sudo -S  docker compose up -d")
print("[INFO] Вывод команды rebuild-docker.bash:")
print(stdout.read().decode())
print("[ERROR] Ошибки команды rebuild-docker.bash:")
print(stderr.read().decode())

scp.close()
ssh.close()
print("[INFO] Соединение с сервером SSH закрыто.")
