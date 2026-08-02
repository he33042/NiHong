# 霓虹日志 (NiHong)

一个使用 DeepSeek + Trae 生成的 Vue3 + TypeScript 博客网站。

## 技术栈

### 前端

- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **样式**: TailwindCSS + shadcn-vue
- **HTTP 客户端**: Axios

### 后端

- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MySQL
- **认证**: JWT (JSON Web Token)
- **加密**: bcrypt

## 功能特性

- 响应式赛博朋克风格 UI，支持暗色/亮色主题切换
- 文章管理：发布、编辑、分类、标签
- AI 写作助手：支持 DeepSeek 等大模型辅助创作
- 评论系统：用户登录后可评论
- 留言板
- 文章搜索
- 文件上传（图片/附件）
- 后台仪表盘：站点数据概览
- 速率限制、安全响应头等安全防护

## 项目结构

```
├── blog-backend/              # 后端服务
│   ├── sql/schema.sql         # 数据库建表 SQL
│   ├── src/
│   │   ├── config/db.js       # 数据库连接池配置
│   │   ├── controllers/       # 控制器层（含 aiController AI 代理）
│   │   ├── middlewares/       # 中间件 (auth, errorHandler, rateLimit)
│   │   ├── routes/            # 路由定义
│   │   ├── scripts/           # 工具脚本 (createAdmin)
│   │   ├── services/          # 业务逻辑层
│   │   ├── utils/             # 工具函数
│   │   ├── app.js             # Express 应用入口
│   │   └── server.js          # 服务启动入口
│   ├── .env.example           # 环境变量模板
│   ├── Dockerfile             # 后端 Docker 构建文件
│   ├── ecosystem.config.js    # PM2 配置
│   └── package.json
├── blog-frontend/             # 前端应用
│   ├── src/
│   │   ├── api/               # API 请求封装
│   │   ├── components/        # 公共组件
│   │   ├── router/            # 路由配置
│   │   ├── stores/            # Pinia 状态管理
│   │   ├── types/             # TypeScript 类型定义
│   │   ├── views/             # 页面组件
│   │   └── lib/               # 工具函数
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
├── docker/                    # Docker 编排
│   ├── docker-compose.yml     # 三容器编排
│   ├── .env.example           # 环境变量模板
│   ├── backend/Dockerfile     # 后端多阶段构建
│   ├── frontend/Dockerfile    # 前端多阶段构建
│   ├── nginx/nginx.conf       # Nginx 反向代理
│   └── mysql/conf.d/          # MySQL 配置
├── nginx.conf                 # Nginx 配置示例
├── DEPLOY.md                  # 部署文档
├── LICENSE                    # MIT 许可证
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- MySQL >= 5.7
- pnpm / npm

### 1. 数据库初始化

```bash
# 创建数据库并导入表结构
mysql -u root -p < blog-backend/sql/schema.sql
```

### 2. 后端配置

```bash
cd blog-backend

# 复制环境变量模板
cp .env.example .env

# 编辑 .env 填写数据库连接信息和 JWT 密钥
vim .env

# 安装依赖
npm install

# 创建管理员账号
node src/scripts/createAdmin.js

# 启动开发服务器
npm run dev
```

### 3. 前端配置

```bash
cd blog-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 4. 访问

- 前端首页: `http://localhost:5173`
- 管理后台: `http://localhost:5173/admin`
- 后端 API: `http://localhost:3000/api`

## 生产部署

详细部署文档请参考 [DEPLOY.md](./DEPLOY.md)，包含以下部署方式：

- Nginx 反向代理 + PM2
- Docker / Docker Compose
- 三容器分离部署（前端 + 后端 + 数据库）
- Cloudflare Pages + 1Panel

## 环境变量

参考 `blog-backend/.env.example`：

```env
PORT=3000                     # 服务端口
NODE_ENV=development          # 运行环境
DB_HOST=localhost             # 数据库地址
DB_PORT=3306                  # 数据库端口
DB_USER=root                  # 数据库用户名
DB_PASSWORD=your_password     # 数据库密码
DB_NAME=blog                  # 数据库名
JWT_SECRET=random_string      # JWT 签名密钥
JWT_EXPIRES_IN=7d             # Token 有效期
BCRYPT_SALT_ROUNDS=10         # bcrypt 加密强度
CORS_ORIGIN=*                 # 跨域来源
```

## 许可证

MIT License - 详见 [LICENSE](./LICENSE)
