// 管理员播种服务：创建或更新管理员账号
// 使用 INSERT ... ON DUPLICATE KEY UPDATE，重复调用即更新密码
const bcrypt = require('bcrypt');
const pool = require('../config/db');

/**
 * @param {string} username   - 登录账号
 * @param {string} password   - 明文密码
 * @param {string} [nickname] - 昵称
 * @param {boolean} [silent]  - 是否静默（不打印密码）
 */
async function seedAdmin(username, password, nickname = '博主', silent = false) {
  const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
  await pool.query(
    `INSERT INTO admin (username, password, nickname) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE password = VALUES(password), nickname = VALUES(nickname)`,
    [username, hash, nickname]
  );
  if (!silent) {
    console.log(`管理员已创建/更新：${username}  /  ${password}`);
  }
}

module.exports = seedAdmin;
