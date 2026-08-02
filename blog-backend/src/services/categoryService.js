const pool = require('../config/db');
const AppError = require('../utils/AppError');

// 分类名称唯一约束冲突统一转 400
function handleDup(err) {
  if (err.code === 'ER_DUP_ENTRY') throw new AppError(400, '分类名称已存在');
  throw err;
}

// 分类列表（公开，供前台筛选导航使用）
exports.listCategories = async () => {
  const [rows] = await pool.query('SELECT id, name, created_at, updated_at FROM category ORDER BY id');
  return rows;
};

// 新增分类（后台）
exports.createCategory = async (name) => {
  try {
    const [r] = await pool.query('INSERT INTO category (name) VALUES (?)', [name]);
    return r.insertId;
  } catch (err) {
    handleDup(err);
  }
};

// 修改分类（后台）
exports.updateCategory = async (id, name) => {
  try {
    const [r] = await pool.query('UPDATE category SET name = ? WHERE id = ?', [name, id]);
    if (!r.affectedRows) throw new AppError(404, '分类不存在');
  } catch (err) {
    handleDup(err);
  }
};

// 删除分类（后台）：文章表的 category_id 由外键自动置 NULL
exports.deleteCategory = async (id) => {
  const [r] = await pool.query('DELETE FROM category WHERE id = ?', [id]);
  if (!r.affectedRows) throw new AppError(404, '分类不存在');
};
