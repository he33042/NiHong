const pool = require('../config/db');
const AppError = require('../utils/AppError');

// 文章评论列表（公开，按文章ID，最多取最近 100 条）
exports.listByArticle = async (articleId) => {
  const [rows] = await pool.query(
    'SELECT id, nickname, content, created_at FROM comment WHERE article_id = ? ORDER BY created_at DESC LIMIT 100',
    [articleId]
  );
  return rows;
};

// 提交评论（公开）：仅允许对已发布文章评论
exports.createComment = async (articleId, nickname, content) => {
  const [[a]] = await pool.query('SELECT id FROM article WHERE id = ? AND status = 1', [articleId]);
  if (!a) throw new AppError(404, '文章不存在或未发布');
  const [r] = await pool.query(
    'INSERT INTO comment (article_id, nickname, content) VALUES (?, ?, ?)',
    [articleId, nickname, content]
  );
  return r.insertId;
};

// 后台评论列表（分页，带文章标题，支持父子结构）
exports.listAll = async ({ page, size }) => {
  const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM comment WHERE parent_id IS NULL');
  const [rows] = await pool.query(
    `SELECT c.id, c.article_id, c.nickname, c.content, c.parent_id, c.reply_nickname, c.created_at, a.title AS article_title
     FROM comment c
     LEFT JOIN article a ON a.id = c.article_id
     WHERE c.parent_id IS NULL
     ORDER BY c.created_at DESC
     LIMIT ? OFFSET ?`,
    [size, (page - 1) * size]
  );
  // 为每条评论查找回复
  for (const row of rows) {
    const [replies] = await pool.query(
      'SELECT id, nickname, content, parent_id, reply_nickname, created_at FROM comment WHERE parent_id = ? ORDER BY created_at ASC',
      [row.id]
    );
    row.replies = replies;
  }
  return { list: rows, total, page, size };
};

// 后台回复评论（管理员回复，含 article_id 回填）
exports.replyComment = async (articleId, nickname, content, parentId) => {
  const [parent] = await pool.query('SELECT nickname, article_id FROM comment WHERE id = ?', [parentId]);
  if (!parent.length) throw new AppError(404, '原评论不存在');
  // 优先使用传入的 articleId，否则从父评论获取
  const aid = articleId || parent[0].article_id;
  const [r] = await pool.query(
    'INSERT INTO comment (article_id, nickname, content, parent_id, reply_nickname) VALUES (?, ?, ?, ?, ?)',
    [aid, nickname, content, parentId, parent[0].nickname]
  );
  return r.insertId;
};

// 删除评论（后台）
exports.deleteComment = async (id) => {
  const [r] = await pool.query('DELETE FROM comment WHERE id = ?', [id]);
  if (!r.affectedRows) throw new AppError(404, '评论不存在');
};
