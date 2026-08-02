const commentService = require('../services/commentService');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

// GET /api/articles/:id/comments 文章评论列表（公开）
exports.listByArticle = async (req, res) => {
  success(res, await commentService.listByArticle(Number(req.params.id)));
};

// POST /api/articles/:id/comments 提交评论（需登录）
exports.create = async (req, res) => {
  const { content } = req.body || {};
  const nickname = req.user.nickname;

  if (!content || !content.trim()) {
    throw new AppError(400, '评论内容不能为空');
  }
  if (content.trim().length > 500) throw new AppError(400, '评论内容不能超过 500 字');

  const id = await commentService.createComment(Number(req.params.id), nickname, content.trim());
  success(res, { id }, '评论成功');
};

// GET /api/admin/comments 后台评论列表（分页，带文章标题）
exports.adminList = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const size = Math.min(Math.max(parseInt(req.query.size, 10) || 10, 1), 50);
  success(res, await commentService.listAll({ page, size }));
};

// DELETE /api/admin/comments/:id 删除评论（需登录）
exports.remove = async (req, res) => {
  await commentService.deleteComment(Number(req.params.id));
  success(res, null, '删除成功');
};

// POST /api/admin/comments/:id/reply 后台回复评论（需登录）
exports.reply = async (req, res) => {
  const { nickname, content } = req.body || {};
  if (!nickname || !content || !content.trim()) {
    throw new AppError(400, '昵称和回复内容不能为空');
  }
  // 由 Service 层统一处理，自动从父评论获取 article_id
  const id = await commentService.replyComment(null, nickname.trim(), content.trim(), Number(req.params.id));
  success(res, { id }, '回复成功');
};
