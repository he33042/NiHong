const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// 用户 JWT 鉴权中间件（与管理员分离）
// 优先从 HttpOnly Cookie 读取 token，其次从 Authorization 头
// 校验成功后将用户信息挂载到 req.user
module.exports = (req, res, next) => {
  // 优先读 Cookie（防 XSS），其次读 Header（兼容旧客户端）
  let token = req.cookies?.blog_user_token || null;
  if (!token) {
    const header = req.headers.authorization || '';
    token = header.startsWith('Bearer ') ? header.slice(7) : null;
  }

  if (!token) {
    return next(new AppError(401, '请先登录'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'user') {
      return next(new AppError(401, '请使用用户账号登录'));
    }
    req.user = payload;
    next();
  } catch (err) {
    next(new AppError(401, '登录状态无效或已过期，请重新登录'));
  }
};
