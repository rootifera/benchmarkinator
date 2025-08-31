FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Set React environment variables from Docker environment variables
ARG WEBADMIN
ARG WEBPASSWORD
ENV REACT_APP_WEBADMIN=$WEBADMIN
ENV REACT_APP_WEBPASSWORD=$WEBPASSWORD

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
