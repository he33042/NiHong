const pool = require('../config/db');
const AppError = require('../utils/AppError');

/** 同步文章-标签关联（先清后插），在事务内复用连接 */
async function syncArticleTags(conn, articleId, tagIds) {
  await conn.query('DELETE FROM article_tag WHERE article_id = ?', [articleId]);
  if (tagIds.length) {
    const values = tagIds.map((tagId) => [articleId, tagId]);
    await conn.query('INSERT INTO article_tag (article_id, tag_id) VALUES ?', [values]);
  }
}

/** 组装文章列表的 WHERE 子句与参数
 * onlyPublished=true  前台：仅已发布
 * onlyPublished=false 后台：全部，可按 status 精确筛选（0=草稿 1=已发布）
 */
function buildWhere({ onlyPublished, status, categoryId, tagId, keyword }) {
  const where = [];
  const params = [];
  if (onlyPublished) {
    where.push('a.status = 1');
  } else if (status === 0 || status === 1) {
    where.push('a.status = ?');
    params.push(status);
  }
  if (keyword) {
    // 关键词搜索：匹配标题 / 简介 / 分类名称 / 标签名称
    const kw = `%${keyword}%`;
    where.push(`(
      a.title LIKE ? OR a.summary LIKE ? OR 
      EXISTS (SELECT 1 FROM category c2 WHERE c2.id = a.category_id AND c2.name LIKE ?) OR 
      EXISTS (SELECT 1 FROM article_tag at2 JOIN tag t2 ON t2.id = at2.tag_id WHERE at2.article_id = a.id AND t2.name LIKE ?)
    )`);
    params.push(kw, kw, kw, kw);
  }
  if (categoryId) {
    where.push('a.category_id = ?');
    params.push(categoryId);
  }
  if (tagId) {
    where.push('EXISTS (SELECT 1 FROM article_tag at WHERE at.article_id = a.id AND at.tag_id = ?)');
    params.push(tagId);
  }
  return { sql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

/** 批量挂载文章标签，避免循环内逐条查询（N+1） */
async function attachTags(articles) {
  if (!articles.length) return articles;
  const ids = articles.map((a) => a.id);
  const [rows] = await pool.query(
    `SELECT at.article_id, t.id, t.name
     FROM article_tag at
     JOIN tag t ON t.id = at.tag_id
     WHERE at.article_id IN (?)`,
    [ids]
  );
  const map = {};
  for (const r of rows) {
    (map[r.article_id] ||= []).push({ id: r.id, name: r.name });
  }
  for (const a of articles) a.tags = map[a.id] || [];
  return articles;
}

// ======================== 前台公开接口 ========================

// 分页获取文章列表：前台仅已发布；后台传 onlyPublished=false 可查全部（含草稿）
exports.listArticles = async ({ page, size, categoryId, tagId, keyword = '', status = null, onlyPublished = true }) => {
  const { sql, params } = buildWhere({ onlyPublished, status, categoryId, tagId, keyword });

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM article a ${sql}`, params);

  const [rows] = await pool.query(
    `SELECT a.id, a.title, a.cover, a.summary, a.category_id, c.name AS category_name,
            a.status, a.created_at, a.updated_at
     FROM article a
     LEFT JOIN category c ON c.id = a.category_id
     ${sql}
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, size, (page - 1) * size]
  );

  await attachTags(rows);
  return { list: rows, total, page, size };
};

// 获取单篇文章详情：前台仅已发布；后台传 onlyPublished=false 可查草稿（编辑回显）
exports.getArticleDetail = async (id, onlyPublished = true) => {
  const [rows] = await pool.query(
    `SELECT a.*, c.name AS category_name
     FROM article a
     LEFT JOIN category c ON c.id = a.category_id
     WHERE a.id = ? ${onlyPublished ? 'AND a.status = 1' : ''}`,
    [id]
  );
  if (!rows.length) throw new AppError(404, onlyPublished ? '文章不存在或未发布' : '文章不存在');
  await attachTags(rows);
  return rows[0];
};

// ======================== 后台管理接口 ========================

// 新增文章（含标签关联，事务保证一致性）
exports.createArticle = async ({ title, cover, summary, content, categoryId, status, tagIds, videoUrl }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      'INSERT INTO article (title, cover, summary, content, category_id, status, video_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, cover, summary, content, categoryId, status, videoUrl || '']
    );
    await syncArticleTags(conn, r.insertId, tagIds);
    await conn.commit();
    return r.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// 修改文章（含标签关联，事务保证一致性）
exports.updateArticle = async (id, { title, cover, summary, content, categoryId, status, tagIds, videoUrl }) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      'UPDATE article SET title = ?, cover = ?, summary = ?, content = ?, category_id = ?, status = ?, video_url = ? WHERE id = ?',
      [title, cover, summary, content, categoryId, status, videoUrl || '', id]
    );
    if (!r.affectedRows) throw new AppError(404, '文章不存在');
    await syncArticleTags(conn, id, tagIds);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// 删除文章：article_tag 关联记录由外键级联自动删除
exports.deleteArticle = async (id) => {
  const [r] = await pool.query('DELETE FROM article WHERE id = ?', [id]);
  if (!r.affectedRows) throw new AppError(404, '文章不存在');
};

// 快捷修改发布状态（后台列表页切换草稿/已发布）
exports.updateArticleStatus = async (id, status) => {
  const [r] = await pool.query('UPDATE article SET status = ? WHERE id = ?', [status, id]);
  if (!r.affectedRows) throw new AppError(404, '文章不存在');
};
