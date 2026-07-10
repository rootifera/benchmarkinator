FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_APP_MODE=admin

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

ARG NGINX_CONF=nginx.conf

COPY --from=builder /app/dist /usr/share/nginx/html

COPY ${NGINX_CONF} /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
