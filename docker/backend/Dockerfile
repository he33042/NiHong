# ===== 阶段1：安装生产依赖 =====
FROM node:20-alpine AS deps
WORKDIR /app
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install --omit=dev

# ===== 阶段2：运行时 =====
FROM node:20-alpine
WORKDIR /app
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.ustc.edu.cn/g' /etc/apk/repositories
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
# 单独安装纯 JS 依赖（不触发 bcrypt 重编译）
RUN npm install cookie-parser --no-save
COPY src ./src
COPY sql ./sql
EXPOSE 3000
CMD ["node", "src/server.js"]
