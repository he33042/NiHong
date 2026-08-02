const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const AppError = require('../utils/AppError');

// 附件存储目录（项目根/uploads，启动时确保存在）
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

exports.UPLOAD_DIR = UPLOAD_DIR;

// 新增附件记录
exports.createAttachment = async (file) => {
  const url = `/uploads/${file.filename}`;
  const [r] = await pool.query(
    'INSERT INTO attachment (filename, original_name, url, size, mime) VALUES (?, ?, ?, ?, ?)',
    [file.filename, file.originalname, url, file.size, file.mimetype]
  );
  return { id: r.insertId, url };
};

// 附件列表（分页，最新在前）
exports.listAttachments = async ({ page, size }) => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM attachment');
  const [rows] = await pool.query(
    'SELECT * FROM attachment ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [size, (page - 1) * size]
  );
  return { list: rows, total, page, size };
};

// 删除附件：先删记录再删磁盘文件（文件删除失败不阻塞）
exports.deleteAttachment = async (id) => {
  const [rows] = await pool.query('SELECT * FROM attachment WHERE id = ?', [id]);
  if (!rows.length) throw new AppError(404, '附件不存在');
  await pool.query('DELETE FROM attachment WHERE id = ?', [id]);
  try {
    fs.unlinkSync(path.join(UPLOAD_DIR, rows[0].filename));
  } catch (err) {
    console.warn('删除附件文件失败（记录已删除）：', err.message);
  }
};
