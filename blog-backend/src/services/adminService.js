const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

// 管理员登录：校验账号密码，成功后签发 JWT
exports.login = async (username, password) => {
  const [rows] = await pool.query('SELECT * FROM admin WHERE username = ?', [username]);
  const admin = rows[0];

  // 账号不存在或密码错误统一提示，避免暴露账号是否存在
  if (!admin) throw new AppError(400, '账号或密码错误');
  const ok = await bcrypt.compare(password, admin.password);
  if (!ok) throw new AppError(400, '账号或密码错误');

  // 签发 Token，含 jti 支持主动失效
  const token = jwt.sign(
    { id: admin.id, username: admin.username, role: 'admin', jti: crypto.randomUUID() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return {
    token,
    admin: { id: admin.id, username: admin.username, nickname: admin.nickname }
  };
};
