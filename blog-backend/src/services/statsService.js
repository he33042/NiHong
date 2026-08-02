const pool = require('../config/db');

// 后台仪表盘统计：文章 / 分类 / 标签 / 留言 数量
exports.getStats = async () => {
  const [[article]] = await pool.query(
    `SELECT COUNT(*) AS total,
            COALESCE(SUM(status = 1), 0) AS published,
            COALESCE(SUM(status = 0), 0) AS draft
     FROM article`
  );
  const [[{ total: categories }]] = await pool.query('SELECT COUNT(*) AS total FROM category');
  const [[{ total: tags }]] = await pool.query('SELECT COUNT(*) AS total FROM tag');
  const [[{ total: messages }]] = await pool.query('SELECT COUNT(*) AS total FROM message');

  return {
    article: { total: Number(article.total), published: Number(article.published), draft: Number(article.draft) },
    categories: Number(categories),
    tags: Number(tags),
    messages: Number(messages)
  };
};
