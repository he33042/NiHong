// 管理员初始化脚本：创建或更新管理员账号
// 用法：
//   node src/scripts/createAdmin.js                    -> admin / 123456 / 博主
//   node src/scripts/createAdmin.js 账号 密码 昵称       -> 自定义
require('dotenv').config();
const seedAdmin = require('../services/adminSeeder');
const pool = require('../config/db');

(async () => {
  const [, , username = 'admin', password = '123456', nickname = '博主'] = [...process.argv, '', '', ''];
  try {
    await seedAdmin(username, password, nickname);
  } catch (err) {
    console.error('初始化管理员失败：', err.message);
  } finally {
    await pool.end();   // 关闭连接池，让进程正常退出
  }
})();
