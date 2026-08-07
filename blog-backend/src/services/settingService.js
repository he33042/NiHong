const pool = require('../config/db');

// 获取全部配置（键值对转对象）
exports.getAll = async () => {
  const [rows] = await pool.query('SELECT k, v FROM setting');
  return Object.fromEntries(rows.map((r) => [r.k, r.v]));
};

// 写入配置（存在则更新）
exports.upsert = async (key, value) => {
  await pool.query('INSERT INTO setting (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [
    key,
    String(value ?? '')
  ]);
};

// 批量写入配置（事务保证原子性）
exports.batchUpsert = async (entries) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    for (const [key, value] of Object.entries(entries)) {
      await conn.query('INSERT INTO setting (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [
        key,
        String(value ?? '')
      ]);
    }
    await conn.commit()
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
};
