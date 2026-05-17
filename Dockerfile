# ====================================
# TuningManual3000 Dockerfile
# ====================================

FROM node:20-alpine

# Рабочая директория
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Порт приложения
EXPOSE 3000

# Команда запуска (production)
CMD ["npm", "start"]
