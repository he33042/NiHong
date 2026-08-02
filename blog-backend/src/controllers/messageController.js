const messageService = require('../services/messageService');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

// GET /api/messages?page=1&size=10 留言列表（公开）
exports.list = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const size = Math.min(Math.max(parseInt(req.query.size, 10) || 10, 1), 50);
  success(res, await messageService.listMessages({ page, size }));
};

// POST /api/messages 提交留言（需登录）
exports.create = async (req, res) => {
  const { content, email, website } = req.body || {};
  const nickname = req.user.nickname;

  if (!content || !content.trim()) {
    throw new AppError(400, '留言内容不能为空');
  }
  if (content.trim().length > 500) throw new AppError(400, '留言内容不能超过 500 字');

  const id = await messageService.createMessage(
    nickname,
    content.trim(),
    (email || '').trim().slice(0, 100),
    (website || '').trim().slice(0, 200)
  );
  success(res, { id }, '留言成功');
};

// POST /api/admin/messages/:id/reply 后台回复留言（需登录）
exports.reply = async (req, res) => {
  const { nickname, content } = req.body || {};
  if (!nickname || !content || !content.trim()) {
    throw new AppError(400, '回复内容和昵称不能为空');
  }
  const id = await messageService.replyMessage(nickname.trim(), content.trim(), Number(req.params.id));
  success(res, { id }, '回复成功');
};

// DELETE /api/admin/messages/:id 删除留言（需登录）
exports.remove = async (req, res) => {
  await messageService.deleteMessage(Number(req.params.id));
  success(res, null, '删除成功');
};
