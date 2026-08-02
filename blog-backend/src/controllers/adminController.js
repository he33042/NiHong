const adminService = require('../services/adminService');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

// POST /api/admin/login 管理员登录（无需 Token）
exports.login = async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) throw new AppError(400, '账号和密码不能为空');
  const data = await adminService.login(username, password);
  // 设置 HttpOnly Cookie 防 XSS 窃取
  res.cookie('blog_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
  });
  success(res, data, '登录成功');
};
