FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Set React environment variables from Docker environment variables
ARG WEBADMIN
ARG WEBPASSWORD
ARG API_KEY
ENV VITE_WEBADMIN=$WEBADMIN
ENV VITE_WEBPASSWORD=$WEBPASSWORD
ENV VITE_API_KEY=$API_KEY

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
