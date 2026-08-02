const userService = require('../services/userService');
const { success } = require('../utils/response');

// POST /api/user/register
exports.register = async (req, res) => {
  const { email, password, nickname } = req.body || {};
  const id = await userService.register(email, password, nickname);
  success(res, { id }, '注册成功');
};

// POST /api/user/login
exports.login = async (req, res) => {
  const { email, password } = req.body || {};
  const data = await userService.login(email, password);
  // 设置 HttpOnly Cookie 防 XSS 窃取
  res.cookie('blog_user_token', data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
  });
  success(res, data, '登录成功');
};

// GET /api/user/profile（需登录）
exports.profile = async (req, res) => {
  const data = await userService.getProfile(req.user.id);
  success(res, data);
};
