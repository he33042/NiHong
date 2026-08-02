const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 注册
exports.register = async (email, password, nickname) => {
  if (!EMAIL_RE.test(email)) throw new AppError(400, '邮箱格式不正确');
  if (password.length < 6) throw new AppError(400, '密码至少6位');
  if (!nickname || !nickname.trim()) throw new AppError(400, '昵称不能为空');
  if (nickname.trim().length > 20) throw new AppError(400, '昵称不能超过20个字符');

  const [exist] = await pool.query('SELECT id FROM user WHERE email = ?', [email.trim().toLowerCase()]);
  if (exist.length) throw new AppError(400, '该邮箱已注册');

  const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 10);
  const [r] = await pool.query(
    'INSERT INTO user (email, password, nickname) VALUES (?, ?, ?)',
    [email.trim().toLowerCase(), hash, nickname.trim()]
  );
  return r.insertId;
};

// 登录
exports.login = async (email, password) => {
  if (!EMAIL_RE.test(email)) throw new AppError(400, '邮箱格式不正确');

  const [rows] = await pool.query('SELECT * FROM user WHERE email = ?', [email.trim().toLowerCase()]);
  if (!rows.length) throw new AppError(400, '邮箱或密码错误');

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError(400, '邮箱或密码错误');

  // 签发 Token，仅含 id/nickname/role，不含邮箱（防解码泄露）
  const token = jwt.sign(
    { id: user.id, nickname: user.nickname, role: 'user', jti: crypto.randomUUID() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  return { token, user: { id: user.id, email: user.email, nickname: user.nickname } };
};

// 获取用户信息
exports.getProfile = async (id) => {
  const [rows] = await pool.query('SELECT id, email, nickname, created_at FROM user WHERE id = ?', [id]);
  if (!rows.length) throw new AppError(404, '用户不存在');
  return rows[0];
};
