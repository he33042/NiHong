# ===== 阶段1：构建前端 =====
FROM node:20-alpine AS builder
WORKDIR /app
COPY blog-frontend/package*.json ./
RUN npm ci
COPY blog-frontend/ .
RUN npm run build

# ===== 阶段2：运行时（Nginx 托管静态文件） =====
FROM nginx:alpine
RUN apk add --no-cache openssl
# 生成自签名证书，无需外部配置
RUN mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/privkey.pem \
      -out /etc/nginx/ssl/fullchain.pem \
      -subj "/CN=api.hknihong.xyz"
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
