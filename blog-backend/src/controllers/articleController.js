const articleService = require('../services/articleService');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

// 解析并校验文章提交数据（新增/修改共用）
function parseArticleBody(body) {
  const {
    title,
    cover = '',
    summary = '',
    content,
    categoryId = null,
    status = 0,
    tagIds = [],
    videoUrl = ''
  } = body || {};

  if (!title || !content) throw new AppError(400, '标题和正文不能为空');
  if (![0, 1].includes(Number(status))) throw new AppError(400, '发布状态仅支持 0(草稿)/1(已发布)');

  return {
    title,
    cover,
    summary,
    content,
    categoryId: categoryId ? Number(categoryId) : null,
    status: Number(status),
    tagIds: Array.isArray(tagIds) ? tagIds.map(Number).filter(Number.isInteger) : [],
    videoUrl: (videoUrl || '').trim().slice(0, 500)
  };
}

// ======================== 后台接口（需 Token）========================

// POST /api/admin/articles 新增文章
exports.create = async (req, res) => {
  const id = await articleService.createArticle(parseArticleBody(req.body));
  success(res, { id }, '新增成功');
};

// PUT /api/admin/articles/:id 修改文章
exports.update = async (req, res) => {
  await articleService.updateArticle(Number(req.params.id), parseArticleBody(req.body));
  success(res, null, '修改成功');
};

// DELETE /api/admin/articles/:id 删除文章
exports.remove = async (req, res) => {
  await articleService.deleteArticle(Number(req.params.id));
  success(res, null, '删除成功');
};

// GET /api/admin/articles?page=1&size=10&status=&categoryId= 后台文章列表（含草稿）
exports.adminList = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const size = Math.min(Math.max(parseInt(req.query.size, 10) || 10, 1), 50);
  const status = req.query.status === undefined || req.query.status === '' ? null : Number(req.query.status);
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;

  const data = await articleService.listArticles({ page, size, categoryId, tagId: null, status, onlyPublished: false });
  success(res, data);
};

// GET /api/admin/articles/:id 后台文章详情（含草稿，用于编辑回显）
exports.adminDetail = async (req, res) => {
  const data = await articleService.getArticleDetail(Number(req.params.id), false);
  success(res, data);
};

// PATCH /api/admin/articles/:id/status 快捷修改发布状态 { status: 0|1 }
exports.updateStatus = async (req, res) => {
  const status = Number(req.body?.status);
  if (![0, 1].includes(status)) throw new AppError(400, '发布状态仅支持 0(草稿)/1(已发布)');
  await articleService.updateArticleStatus(Number(req.params.id), status);
  success(res, null, status === 1 ? '已发布' : '已转为草稿');
};

// ======================== 前台公开接口（无需 Token）========================

// GET /api/articles?page=1&size=10&categoryId=1&tagId=2&keyword=xx 分页文章列表
// categoryId / tagId 可选，用于按分类 / 标签筛选；keyword 可选，搜索标题与简介
exports.list = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const size = Math.min(Math.max(parseInt(req.query.size, 10) || 10, 1), 50); // 单页上限 50
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : null;
  const tagId = req.query.tagId ? Number(req.query.tagId) : null;
  const keyword = req.query.keyword ? String(req.query.keyword).trim().slice(0, 50) : '';

  const data = await articleService.listArticles({ page, size, categoryId, tagId, keyword });
  success(res, data);
};

// GET /api/articles/:id 文章详情
exports.detail = async (req, res) => {
  const data = await articleService.getArticleDetail(Number(req.params.id));
  success(res, data);
};
