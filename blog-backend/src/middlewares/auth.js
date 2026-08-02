const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// JWT 登录鉴权中间件（仅允许管理员）
// 优先从 HttpOnly Cookie 读取 token，其次从 Authorization 头
module.exports = (req, res, next) => {
  // 优先读 Cookie（防 XSS），其次读 Header（兼容旧客户端）
  let token = req.cookies?.blog_token || null;
  if (!token) {
    const header = req.headers.authorization || '';
    token = header.startsWith('Bearer ') ? header.slice(7) : null;
  }

  if (!token) {
    return next(new AppError(401, '未登录，请先登录'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // 仅允许管理员角色，普通用户 token 不可用于后台接口
    if (payload.role !== 'admin') {
      return next(new AppError(403, '无权访问后台接口'));
    }
    // 校验通过后把管理员信息挂载到 req.admin，供后续接口使用
    req.admin = payload; // { id, username, role }
    next();
  } catch (err) {
    next(new AppError(401, '登录状态无效或已过期，请重新登录'));
  }
};
