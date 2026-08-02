const pool = require('../config/db');
const AppError = require('../utils/AppError');

// 留言列表（公开，分页，最新在前）
exports.listMessages = async ({ page, size }) => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM message');
  const [rows] = await pool.query(
    'SELECT id, nickname, content, email, website, parent_id, created_at FROM message WHERE parent_id IS NULL ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [size, (page - 1) * size]
  );
  // 为每条留言查找回复
  for (const row of rows) {
    const [replies] = await pool.query(
      'SELECT id, nickname, content, created_at FROM message WHERE parent_id = ? ORDER BY created_at ASC',
      [row.id]
    );
    row.replies = replies;
  }
  return { list: rows, total, page, size };
};

// 新增留言（公开提交，支持联系方式 + 回复）
exports.createMessage = async (nickname, content, email = '', website = '', parentId = null) => {
  const [r] = await pool.query(
    'INSERT INTO message (nickname, content, email, website, parent_id) VALUES (?, ?, ?, ?, ?)',
    [nickname, content, email, website, parentId]
  );
  return r.insertId;
};

// 后台回复留言（管理员回复）
exports.replyMessage = async (nickname, content, parentId) => {
  const [parent] = await pool.query('SELECT nickname FROM message WHERE id = ?', [parentId]);
  if (!parent.length) throw new AppError(404, '原留言不存在');
  const replyContent = `回复 @${parent[0].nickname}：${content}`;
  return exports.createMessage(nickname, replyContent, '', '', parentId);
};

// 删除留言（后台管理）
exports.deleteMessage = async (id) => {
  const [r] = await pool.query('DELETE FROM message WHERE id = ?', [id]);
  if (!r.affectedRows) throw new AppError(404, '留言不存在');
};
