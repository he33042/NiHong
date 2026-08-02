const tagService = require('../services/tagService');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

// 校验标签名称
function parseName(body) {
  const { name } = body || {};
  if (!name || !String(name).trim()) throw new AppError(400, '标签名称不能为空');
  return String(name).trim();
}

// GET /api/tags 标签列表（前台公开）
exports.list = async (req, res) => {
  success(res, await tagService.listTags());
};

// POST /api/admin/tags 新增标签（需 Token）
exports.create = async (req, res) => {
  const id = await tagService.createTag(parseName(req.body));
  success(res, { id }, '新增成功');
};

// PUT /api/admin/tags/:id 修改标签（需 Token）
exports.update = async (req, res) => {
  await tagService.updateTag(Number(req.params.id), parseName(req.body));
  success(res, null, '修改成功');
};

// DELETE /api/admin/tags/:id 删除标签（需 Token）
exports.remove = async (req, res) => {
  await tagService.deleteTag(Number(req.params.id));
  success(res, null, '删除成功');
};
