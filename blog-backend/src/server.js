// 服务入口：加载环境变量 -> 自动建表 -> 向后兼容迁移 -> 初始化管理员 -> 启动 HTTP 服务
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const app = require('./app');
const pool = require('./config/db');
const seedAdmin = require('./services/adminSeeder');

const PORT = Number(process.env.PORT || 3000);
const DB_NAME = process.env.DB_NAME || 'blog';

/**
 * 检查指定列是否存在
 */
async function columnExists(table, column) {
  const [rows] = await pool.query(
    'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [DB_NAME, table, column]
  );
  return rows.length > 0;
}

/**
 * 检查指定索引是否存在
 */
async function indexExists(table, indexName) {
  const [rows] = await pool.query(
    'SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
    [DB_NAME, table, indexName]
  );
  return rows.length > 0;
}

/**
 * 自动执行 schema.sql + 向后兼容列级迁移
 */
async function autoMigrate() {
  // 1. 先测试数据库连接
  try {
    await pool.query('SELECT 1');
    console.log('MySQL 连接成功');
  } catch (err) {
    console.error('MySQL 连接失败，请检查 .env 数据库配置：', err.message);
    process.exit(1);
  }

  // 2. 定位并执行 schema.sql（新表通过 CREATE TABLE IF NOT EXISTS 创建）
  const sqlPath = path.resolve(__dirname, '..', 'sql', 'schema.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('schema.sql 未找到:', sqlPath);
    process.exit(1);
  }

  const mysql = require('mysql2/promise');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  try {
    await conn.query(fs.readFileSync(sqlPath, 'utf8'));
  } catch (e) {
    console.error('schema.sql 执行失败:', e.message);
    process.exit(1);
  } finally {
    await conn.end();
  }

  // 3. 向后兼容列级迁移：为已有旧表补充缺失字段（幂等，列存在则跳过）
  const migrations = [
    // message 表：email / website / parent_id（旧版 message 表缺少这三列）
    { table: 'message', col: 'email',     sql: "ALTER TABLE message ADD COLUMN email VARCHAR(100) NOT NULL DEFAULT '' COMMENT '邮箱（选填）' AFTER content" },
    { table: 'message', col: 'website',   sql: "ALTER TABLE message ADD COLUMN website VARCHAR(200) NOT NULL DEFAULT '' COMMENT '个人网站（选填）' AFTER email" },
    { table: 'message', col: 'parent_id', sql: "ALTER TABLE message ADD COLUMN parent_id INT UNSIGNED DEFAULT NULL COMMENT '父留言ID（楼中楼回复）' AFTER website" },
    // comment 表：parent_id / reply_nickname（旧版 comment 表缺少这两列，用于支持回复功能）
    { table: 'comment', col: 'parent_id',      sql: "ALTER TABLE comment ADD COLUMN parent_id INT UNSIGNED DEFAULT NULL COMMENT '父评论ID（回复）' AFTER content" },
    { table: 'comment', col: 'reply_nickname', sql: "ALTER TABLE comment ADD COLUMN reply_nickname VARCHAR(20) DEFAULT '' COMMENT '被回复者昵称' AFTER parent_id" },
    // 后续新增字段在这里追加...
  ];

  for (const m of migrations) {
    if (!await columnExists(m.table, m.col)) {
      try {
        await pool.query(m.sql);
        console.log(`迁移: ${m.table}.${m.col} 已添加`);
      } catch (e) {
        console.warn(`迁移失败 ${m.table}.${m.col}:`, e.message);
      }
    }
  }

  // 索引迁移
  if (!await indexExists('message', 'idx_parent')) {
    try {
      await pool.query('ALTER TABLE message ADD INDEX idx_parent (parent_id)');
      console.log('迁移: message.idx_parent 索引已添加');
    } catch (e) {
      console.warn('索引迁移失败:', e.message);
    }
  }

  if (!await indexExists('comment', 'idx_parent')) {
    try {
      await pool.query('ALTER TABLE comment ADD INDEX idx_parent (parent_id)');
      console.log('迁移: comment.idx_parent 索引已添加');
    } catch (e) {
      console.warn('索引迁移失败:', e.message);
    }
  }

  console.log('数据库就绪');

  // 4. 初始化默认管理员（INSERT ON DUPLICATE KEY UPDATE，重启即更新密码）
  await seedAdmin(
    process.env.ADMIN_USERNAME || 'admin',
    process.env.ADMIN_PASSWORD || '123456',
    process.env.ADMIN_NICKNAME || '博主',
    true
  );
}

(async () => {
  await autoMigrate();
  app.listen(PORT, () => {
    console.log(`服务已启动: http://localhost:${PORT}`);
  });
})();
