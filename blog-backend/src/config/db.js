const mysql = require('mysql2/promise');

// MySQL 连接池（配置项来自 .env，由入口文件统一加载 dotenv）
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blog',
  waitForConnections: true,
  connectionLimit: 10, // 最大连接数
  queueLimit: 0,
  charset: 'utf8mb4'
});

module.exports = pool;
