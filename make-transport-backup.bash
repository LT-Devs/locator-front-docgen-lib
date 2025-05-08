#!/bin/bash

# Определяем директорию для хранения резервной копии
BACKUP_DIR="/run/media/kiko/USB/transport-folder"
# Имя zip файла
ZIP_FILE="transport.tar.gz"

#Есть ли такая папка?
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Папка $BACKUP_DIR не найдена"
    exit 1
fi
sudo rm -r petitions_release
mkdir petitions_release

cd petitions_frontend

sudo docker build -t frontend_petition --build-arg VITE_BACKEND_URL="http://10.17.1.216:8001" --build-arg VITE_FILE_BACKEND_URL="http://10.17.1.216:8002" .
sudo docker save -o ../petitions_release/frontend_petition.tar frontend_petition

cd ../

cd petitions_backend
sudo docker build -t backend_petition .
sudo docker save -o ../petitions_release/backend_petition.tar backend_petition

cd ../

sudo tar czvf "$ZIP_FILE" petitions_release

# Копируем zip файл и upload-to-server.py в папку транспорта
mv "$ZIP_FILE" "$BACKUP_DIR"
cp "upload-to-server.py" "$BACKUP_DIR" 
cd $BACKUP_FOLDER

sudo rm -r petitions_release

echo "Транспорт успешно создан и загружен в $BACKUP_DIR"
