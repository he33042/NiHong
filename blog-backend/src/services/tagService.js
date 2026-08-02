const pool = require('../config/db');
const AppError = require('../utils/AppError');

// 标签名称唯一约束冲突统一转 400
function handleDup(err) {
  if (err.code === 'ER_DUP_ENTRY') throw new AppError(400, '标签名称已存在');
  throw err;
}

// 标签列表（公开，供前台筛选导航使用）
exports.listTags = async () => {
  const [rows] = await pool.query('SELECT id, name, created_at, updated_at FROM tag ORDER BY id');
  return rows;
};

// 新增标签（后台）
exports.createTag = async (name) => {
  try {
    const [r] = await pool.query('INSERT INTO tag (name) VALUES (?)', [name]);
    return r.insertId;
  } catch (err) {
    handleDup(err);
  }
};

// 修改标签（后台）
exports.updateTag = async (id, name) => {
  try {
    const [r] = await pool.query('UPDATE tag SET name = ? WHERE id = ?', [name, id]);
    if (!r.affectedRows) throw new AppError(404, '标签不存在');
  } catch (err) {
    handleDup(err);
  }
};

// 删除标签（后台）：article_tag 关联记录由外键级联自动删除
exports.deleteTag = async (id) => {
  const [r] = await pool.query('DELETE FROM tag WHERE id = ?', [id]);
  if (!r.affectedRows) throw new AppError(404, '标签不存在');
};
