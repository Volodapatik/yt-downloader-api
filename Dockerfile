# Базовий образ з Node.js
FROM node:18-slim

# Встановлюємо в систему python3, curl та ffmpeg (необхідні для yt-dlp)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    curl \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Встановлюємо останню версію yt-dlp прямо з офіційного репозиторію GitHub
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Створюємо робочу папку в контейнері
WORKDIR /usr/src/app

# Копіюємо файли залежностей npm
COPY package*.json ./

# Встановлюємо модулі
RUN npm install

# Копіюємо весь інший код нашого сервера
COPY . .

# Відкриваємо порт
EXPOSE 8080

# Команда для старту нашого додатка в хмарі
CMD [ "node", "server.js" ]
