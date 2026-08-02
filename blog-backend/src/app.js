const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const routes = require('./routes');
const { notFound, errorHandler, multerErrorHandler } = require('./middlewares/errorHandler');

const app = express();

// 信任 Nginx 反向代理（Docker 环境 Nginx 在前，不设置会导致 express-rate-limit 报错）
app.set('trust proxy', 1);

// ---------- 安全响应头 ----------
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // 由下方自定义中间件处理
}));

// 手动设置 CSP（确保生效）
app.use((_req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https:; " +
    "media-src 'self'; " +
    "object-src 'none'; " +
    "frame-src https://www.youtube.com https://player.bilibili.com"
  );
  next();
});

// ---------- 全局速率限制 ----------
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 分钟窗口
  max: 200,              // 每 IP 最多 200 次/分钟
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
});
app.use(globalLimiter);

// ---------- 敏感接口严格限流 ----------
const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,                // 登录/注册最多 5 次/分钟
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '操作过于频繁，请1分钟后再试' }
});
const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,               // 留言/评论最多 15 次/分钟
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, message: '操作过于频繁，请稍后再试' }
});
// 挂载到 app 供路由使用
app.locals.strictLimiter = strictLimiter;
app.locals.postLimiter = postLimiter;

// ---------- 跨域 CORS 配置 ----------
const origins = (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim());
const allowAll = origins.includes('*');
app.use(
  cors({
    origin: allowAll ? true : origins, // true=反射请求来源, 支持 credentials
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// ---------- 基础中间件 ----------
app.use(require('cookie-parser')());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

// 附件静态目录
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// ---------- 业务路由 ----------
app.use(routes);

// ---------- Multer 错误处理（必须在路由之后） ----------
app.use(multerErrorHandler);

// ---------- 兜底处理 ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
