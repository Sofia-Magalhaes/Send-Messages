FROM node:18-alpine

    WORKDIR /app

    COPY package*.json ./

    RUN npm install

    COPY . .

    # Instalação do Chrome
    RUN apk update && \
        apk add chromium

    EXPOSE 3000

    CMD ["node", "index.js"] # ou o nome do seu arquivo principal