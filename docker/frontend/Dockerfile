# ===== 阶段1：构建前端 =====
FROM node:20-alpine AS builder
WORKDIR /app
COPY blog-frontend/package*.json ./
RUN npm ci
COPY blog-frontend/ .
RUN npm run build

# ===== 阶段2：运行时（Nginx 托管静态文件） =====
FROM nginx:alpine
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
