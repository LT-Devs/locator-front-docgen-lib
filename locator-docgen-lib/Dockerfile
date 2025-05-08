# Этап сборки
FROM node:alpine AS builder

# Аргументы сборки
ARG VITE_BACKEND_URL
ARG VITE_FILE_BACKEND_URL

# Устанавливаем переменные окружения
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL:-http://localhost:8000}
ENV VITE_FILE_BACKEND_URL=${VITE_FILE_BACKEND_URL:-http://localhost:8001}

WORKDIR /app

# Копируем ВСЕ файлы включая node_modules
COPY . .
# Сборка приложения
RUN npm run build

# Финальный образ
FROM nginx:alpine

# Устанавливаем владельца для nginx директории
RUN chown -R nginx:nginx /usr/share/nginx/html

# Копируем собранное приложение с правильными правами
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

# Копируем кастомную конфигурацию nginx
COPY --chown=nginx:nginx nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт для приложения
EXPOSE 4173

# Запускаем nginx в foreground режиме
CMD ["nginx", "-g", "daemon off;"]
