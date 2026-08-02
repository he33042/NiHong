# 霓虹日志博客 — Linux 部署文档

适用系统：CentOS 7/8/9、Rocky Linux 8/9、openEuler 22.03+

---

## 目录

1. [MySQL 数据库导入](#1-mysql-数据库导入)
2. [前端打包 dist](#2-前端打包-dist)
3. [Nginx 反向代理（静态资源 + API 转发）](#3-nginx-反向代理)
4. [PM2 常驻启动 Node 服务](#4-pm2-常驻启动-node-服务)
5. [Docker 三容器分离部署](#5-docker-三容器分离部署)
6. [监控体系思路（Prometheus + Grafana + Loki）](#6-监控体系思路)

---

## 前置准备

```bash
# 安装 Node.js 20.x（CentOS / Rocky / openEuler 通用）
yum install -y nodejs

# 验证
node -v   # v20.x
npm -v    # 10.x

# 安装 Git（拉取代码）
yum install -y git

# git拉取代码
git clone https://github.com/he33042/NiHong.git

# 安装 PM2（进程管理）
npm install -g pm2
```

---

## 1. MySQL 数据库导入

### 1.1 安装 MySQL 8.0

```bash
# CentOS / Rocky Linux
yum install -y https://dev.mysql.com/get/mysql80-community-release-el7-7.noarch.rpm
yum install -y mysql-community-server
systemctl enable mysqld --now

# openEuler
yum install -y mysql mysql-server
systemctl enable mysqld --now
```

### 1.2 获取临时密码并修改

```bash
# 查看初始临时密码
grep 'temporary password' /var/log/mysqld.log

# 登录并修改密码
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'YourNewPassword123!';
FLUSH PRIVILEGES;
```

### 1.3 创建数据库并导入表结构

```bash
# 方法一：直接执行 SQL 文件
mysql -u root -p < blog-backend/sql/schema.sql

# 方法二：先创建数据库再导入
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS blog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p blog < blog-backend/sql/schema.sql
```

### 1.4 创建应用专用账号（推荐）

```sql
CREATE USER 'blog'@'localhost' IDENTIFIED BY 'blogUserPassword';
GRANT ALL PRIVILEGES ON blog.* TO 'blog'@'localhost';
FLUSH PRIVILEGES;
```

### 1.5 配置环境变量和初始化管理员

```bash
cd blog-backend

# 复制并修改环境变量
cp .env.example .env
vim .env

# .env 中设置管理员初始账号（server.js 启动时自动创建/更新）
# ADMIN_USERNAME=admin       # 管理员账号
# ADMIN_PASSWORD=123456      # 管理员密码（修改后重启即生效）
# ADMIN_NICKNAME=博主        # 管理员昵称

# 启动后端（自动完成建表和创建管理员）
npm run dev
```

> **说明**：`server.js` 启动时会自动读取 `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_NICKNAME` 环境变量，通过 `INSERT ON DUPLICATE KEY UPDATE` 创建或更新管理员账号。修改 `.env` 中的 `ADMIN_PASSWORD` 后重启服务即可更新密码。

也可手动通过命令行重置：

```bash
# 默认 admin / 123456 / 博主
node src/scripts/createAdmin.js

# 自定义
node src/scripts/createAdmin.js 账号 密码 昵称
```

---

## 2. 前端打包 dist

### 2.1 构建命令

```bash
cd ../blog-frontend

# 安装依赖
npm install

# 生产构建（输出到 dist/ 目录）
npm run build
```

### 2.2 构建产物

```
blog-frontend/dist/
├── index.html           # SPA 入口
├── assets/              # 带哈希的 JS/CSS/字体/图片
│   ├── index-xxxxx.js
│   ├── index-xxxxx.css
│   └── ...
└── favicon.ico
```

### 2.3 部署 dist

```bash
# 安装nginx服务
yum install -y nginx
systemctl enable nginx --now

# 将 dist 目录复制到 Nginx 静态目录
cp -r blog-frontend/dist/* /usr/share/nginx/html/
```

---

## 3. Nginx 反向代理

### 3.1 启动 Nginx

```bash
systemctl enable nginx --now
```

### 3.2 配置文件

创建 `/etc/nginx/conf.d/blog.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;   # 替换为你的域名或服务器IP

    # 前端静态资源（构建后的 dist 目录）
    root /usr/share/nginx/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1024;
    gzip_vary on;

    # 静态资源缓存（带哈希的文件长期缓存）
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 反向代理到后端 Node 服务
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 超时设置（AI 写作可能耗时较长）
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
        proxy_send_timeout 60s;
    }

    # 上传文件代理
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }

    # SPA 路由回退：所有非静态文件请求返回 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3.3 HTTPS 配置（可选，使用 acme.sh 或 certbot）

```bash
# 使用 certbot 自动获取 Let's Encrypt 证书
yum install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## 4. PM2 常驻启动 Node 服务

### 4.1 配置文件（`blog-backend/ecosystem.config.js`，项目中已存在）

```js
module.exports = {
  apps: [
    {
      name: 'blog-backend',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

### 4.2 启动命令

```bash
cd /root/NiHong/blog-backend

# 安装生产依赖
npm ci --omit=dev

# 创建日志目录
mkdir -p logs

# PM2 启动
pm2 start ecosystem.config.js

# 保存进程列表（重启后自动恢复）
pm2 save

# 设置开机自启
pm2 startup systemd
# 执行上面命令输出的 sudo 命令

# 常用管理命令
pm2 list                # 查看进程列表
# 如果状态显示为errored则重启
ss -tlnp | grep 3000    # 查找进程
kill -9 <PID>           #杀死进程
pm2 restart blog-backend  # 重启
pm2 logs blog-backend   # 查看日志
pm2 stop blog-backend   # 停止
pm2 delete blog-backend # 删除
```

---

## 5. Docker 三容器分离部署

三容器独立部署：`blog-frontend`（Vue 构建 + Nginx）、`blog-backend`（Node.js）、`blog-mysql`（MySQL）。

### 5.1 安装 Docker 和 Docker Compose

```bash
# CentOS / Rocky / openEuler 通用安装 Docker
curl -fsSL https://get.docker.com | bash -
systemctl enable docker --now

# 安装 Docker Compose（独立二进制）
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 5.2 项目结构

```
项目根目录/
├── blog-backend/          # 后端源码
│   ├── src/
│   ├── sql/schema.sql
│   └── package.json
├── blog-frontend/            # 前端源码
│   └── dist/                 # 构建产物（docker-compose 构建时自动生成，无需手动打包）
└── docker/                   # Docker 编排（统一管理）
    ├── docker-compose.yml    # 三容器编排
    ├── .env                  # 环境变量（从 .env.example 复制）
    ├── backend/
    │   └── Dockerfile        # 后端多阶段构建镜像
    ├── frontend/
    │   └── Dockerfile        # 前端多阶段构建镜像
    ├── nginx/
    │   └── nginx.conf        # Nginx 反向代理配置
    └── mysql/
        └── conf.d/
            └── custom.cnf    # MySQL 字符集 / 调优
```

### 5.3 后端 Dockerfile（多阶段构建）

`docker/backend/Dockerfile`：

```dockerfile
# ===== 阶段1：安装生产依赖 =====
FROM node:20-alpine AS deps
WORKDIR /app
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --omit=dev

# ===== 阶段2：运行时 =====
FROM node:20-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY sql ./sql
EXPOSE 3000
CMD ["node", "src/server.js"]
```

### 5.4 前端 Dockerfile（多阶段构建）

`docker/frontend/Dockerfile`：

```dockerfile
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
```

### 5.5 Nginx 配置

`docker/nginx/nginx.conf`：

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1024;
    gzip_vary on;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /api/ {
        proxy_pass http://blog-backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
    }

    location /uploads/ {
        proxy_pass http://blog-backend:3000;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 5.6 MySQL 自定义配置

`docker/mysql/conf.d/custom.cnf`（项目中已存在）：

```ini
[mysqld]
character-set-server = utf8mb4
collation-server     = utf8mb4_unicode_ci
default-time-zone    = +08:00
max_connections      = 200
innodb_buffer_pool_size = 256M

[client]
default-character-set = utf8mb4
```

### 5.7 docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: blog-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      TZ: Asia/Shanghai
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/conf.d:/etc/mysql/conf.d:ro
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --default-time-zone=+08:00
    healthcheck:
      test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost', '-u', 'root', '-p${MYSQL_ROOT_PASSWORD}']
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 40s
    networks:
      - blog-net

  backend:
    build:
      context: ../blog-backend
      dockerfile: ../docker/backend/Dockerfile
    container_name: blog-backend
    restart: always
    environment:
      PORT: 3000
      NODE_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: ${MYSQL_USER}
      DB_PASSWORD: ${MYSQL_PASSWORD}
      DB_NAME: ${MYSQL_DATABASE}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: ${JWT_EXPIRES_IN:-7d}
      BCRYPT_SALT_ROUNDS: 10
      CORS_ORIGIN: '*'
      ADMIN_USERNAME: ${ADMIN_USERNAME:-admin}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-123456}
      ADMIN_NICKNAME: ${ADMIN_NICKNAME:-博主}
    depends_on:
      mysql:
        condition: service_healthy
    volumes:
      - uploads_data:/app/uploads
    networks:
      - blog-net

  frontend:
    build:
      context: ..
      dockerfile: docker/frontend/Dockerfile
    container_name: blog-frontend
    restart: always
    ports:
      - '80:80'
    depends_on:
      - backend
    networks:
      - blog-net

volumes:
  mysql_data:
  uploads_data:

networks:
  blog-net:
    driver: bridge
```

### 5.8 .env 文件

`docker/.env.example` 已提供模板，复制并修改：

```bash
cd docker
cp .env.example .env
vim .env
```

```env
# MySQL
MYSQL_ROOT_PASSWORD=your_secure_root_password_here
MYSQL_DATABASE=blog
MYSQL_USER=blog
MYSQL_PASSWORD=your_secure_blog_password_here

# JWT
JWT_SECRET=change_me_to_a_random_string_at_least_32_characters
JWT_EXPIRES_IN=7d

# 默认管理员（修改密码后重启容器即生效）
ADMIN_USERNAME=admin
ADMIN_PASSWORD=123456
ADMIN_NICKNAME=博主
```

### 5.9 部署步骤

```bash
# === 1. 克隆项目到服务器 ===
cd /opt
git clone https://github.com/he33042/NiHong.git blog
cd blog

# === 2. 创建 .env 文件（务必修改密码！）===
cd docker
cp .env.example .env
vim .env

# === 3. 构建并启动所有容器 ===
docker-compose up -d --build

# === 4. 查看启动日志 ===
docker-compose logs -f
# 预期输出:
#   MySQL 连接成功
#   数据库就绪
#   服务已启动: http://localhost:3000
# 按 Ctrl+C 退出日志追踪
```

### 5.10 验证部署

```bash
# 1) 检查容器状态
docker-compose ps
# 三个容器 STATUS 均应为 Up

# 2) 验证数据库表
docker exec blog-mysql mysql -u blog -p"${MYSQL_PASSWORD}" blog -e "SHOW TABLES;"
# 应输出: admin, user, category, tag, article, article_tag, message, comment, attachment, setting

# 3) 验证管理员
docker exec blog-mysql mysql -u blog -p"${MYSQL_PASSWORD}" blog -e "SELECT id, username, nickname FROM admin;"

# 4) 验证后端 API
curl http://localhost:3000/api/articles?page=1

# 5) 验证前端页面
curl -I http://localhost/
# HTTP/1.1 200 OK
```

### 5.11 更新部署

```bash
cd /opt/blog/docker

# 拉取最新代码
cd .. && git pull && cd docker

# 重建并重启
docker-compose up -d --build

# 仅重建后端
docker-compose up -d --build backend

# 仅重建前端
docker-compose up -d --build frontend
```

### 5.12 常见排查

| 现象 | 原因 | 解决 |
|------|------|------|
| 启动后表不存在 | 后端未正常启动或数据库连接失败 | `docker logs blog-backend` 查看启动日志，确认 "MySQL 连接成功" 和 "数据库就绪" |
| `Access denied` | `.env` 密码不一致 | 确保 `.env` 中 MYSQL_ROOT_PASSWORD / MYSQL_PASSWORD 正确 |
| MySQL 启动超时 | SELinux 或首次下载镜像慢 | `chcon -Rt svirt_sandbox_file_t docker/mysql/` 或临时 `setenforce 0` |
| npm ci 失败 | package-lock.json 过期 | 运行 `npm install` 更新 lock 文件后重新构建 |
| 端口被占用 | 宿主机 80/3306 端口冲突 | 修改 docker-compose.yml 中的端口映射 |

---

## 6. 监控体系思路

以下是可落地的监控方案架构和关键配置要点（不展开完整配置）。

### 8.1 组件关系

```
┌─────────────────────────────────────────────────────────┐
│                      Grafana 面板                        │
│          (数据可视化 / 告警规则 / 仪表板)                    │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
    ┌────────▼────────┐        ┌────────▼────────┐
    │   Prometheus    │        │      Loki        │
    │  (指标时序数据库) │        │   (日志聚合)      │
    └───┬──────┬──────┘        └────────┬─────────┘
        │      │                        │
   ┌────▼──┐ ┌─▼──────────┐   ┌────────▼─────────┐
   │ Node  │ │Nginx       │   │    Promtail       │
   │Export │ │Exporter    │   │ (日志采集/标签化)   │
   │(CPU/  │ │(请求量/    │   │ → /var/log/nginx  │
   │ 内存/  │ │ 状态码/    │   │ → pm2 logs        │
   │ 磁盘)  │ │ 延迟)      │   │ → docker logs     │
   └───────┘ └────────────┘   └───────────────────┘
```

### 8.2 部署清单

| 组件 | 端口 | 采集目标 |
|------|------|----------|
| **Prometheus** | 9090 | 时序指标存储 + 告警 |
| **Grafana** | 3001 | 面板展示（另选端口，避免与后端冲突） |
| **Node Exporter** | 9100 | 宿主机 CPU/内存/磁盘/网络 |
| **Nginx Exporter** | 9113 | Nginx 请求量/状态码/延迟（需开启 `stub_status`） |
| **Loki** | 3100 | 日志聚合查询 |
| **Promtail** | 9080 | 采集日志并推送至 Loki |

### 8.3 关键配置要点

**1) Nginx 开启 stub_status**

```nginx
# 在 nginx.conf 的 server 块中添加
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

**2) Prometheus 抓取配置 (`prometheus.yml`)**

```yaml
scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'nginx'
    static_configs:
      - targets: ['localhost:9113']

  - job_name: 'blog-backend'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'    # 后端需暴露 /metrics 端点
```

**3) Promtail 采集路径**

```yaml
scrape_configs:
  - job_name: nginx_logs
    static_configs:
      - targets: [localhost]
        labels:
          job: nginx
          __path__: /var/log/nginx/access.log

  - job_name: pm2_logs
    static_configs:
      - targets: [localhost]
        labels:
          job: blog-backend
          __path__: /opt/blog/backend/logs/*.log
```

**4) 后端暴露 Prometheus 指标（可选）**

在 Express 中可通过 `prom-client` 库暴露自定义指标：

```js
// 在 app.js 中添加
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'blog_' });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

### 8.4 一键部署（Docker Compose）

```yaml
# monitoring/docker-compose.yml
services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - '9090:9090'

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3001:3000'
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

  node-exporter:
    image: quay.io/prometheus/node-exporter:latest
    ports:
      - '9100:9100'
    pid: host
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    ports:
      - '9113:9113'
    command:
      - '-nginx.scrape-uri=http://nginx:80/nginx_status'
      - '-web.listen-address=:9113'

  loki:
    image: grafana/loki:latest
    ports:
      - '3100:3100'
    volumes:
      - ./loki-config.yml:/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log:ro
      - /opt/blog/backend/logs:/opt/blog/backend/logs:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
```

### 8.5 常用 Grafana 仪表板

从 [Grafana Dashboards](https://grafana.com/grafana/dashboards/) 导入现成模板：
- **Node Exporter Full**: ID `1860` — 服务器资源全景
- **Nginx**: ID `11190` — Nginx 请求监控
- **Loki Logs**: 手动创建 Explore 查询

---

## 快速排查

### 后端启动失败

```bash
# 查看 PM2 日志
pm2 logs blog-backend --lines 50

# 查看 Docker 日志
docker logs blog-backend --tail 50

# 测试数据库连接
mysql -h 127.0.0.1 -u blog -pblog_pass_2024 blog -e "SELECT 1;"

# Docker 环境下测试
docker exec blog-backend node -e "
  const mysql = require('mysql2/promise');
  mysql.createConnection({
    host:'mysql', user:'blog', password:process.env.DB_PASSWORD, database:'blog'
  }).then(c => { console.log('DB OK'); c.end(); }).catch(e => console.error(e));
"
```

### 前端 403 / 空白页

```bash
# 检查 index.html 是否存在
ls -la /usr/share/nginx/html/index.html

# 查看 Nginx 错误日志
tail -f /var/log/nginx/error.log
docker logs blog-nginx 2>&1 | tail -20
```

### API 502 Bad Gateway

```bash
# 确认后端是否在运行
curl http://127.0.0.1:3000/api/articles?page=1

# Docker 环境检查容器间网络
docker exec blog-nginx ping blog-backend
```

### MySQL 初始化失败（Docker）

```bash
# 1. 查看后端启动日志（server.js 会自动建表并输出日志）
docker logs blog-backend 2>&1 | head -30
# 成功: "MySQL 连接成功" → "数据库就绪" → "服务已启动: http://localhost:3000"
# 迁移: 如 "迁移: message.email 已添加" 表示补充了缺失字段

# 2. 手动验证表是否存在
docker exec blog-mysql mysql -u blog -p"${MYSQL_PASSWORD}" blog -e "SHOW TABLES;"

# 3. 强制重新初始化（⚠ 会删除所有数据！）
docker-compose down -v
docker-compose up -d
```
