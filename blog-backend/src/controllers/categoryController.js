const categoryService = require('../services/categoryService');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');

// 校验分类名称
function parseName(body) {
  const { name } = body || {};
  if (!name || !String(name).trim()) throw new AppError(400, '分类名称不能为空');
  return String(name).trim();
}

// GET /api/categories 分类列表（前台公开）
exports.list = async (req, res) => {
  success(res, await categoryService.listCategories());
};

// POST /api/admin/categories 新增分类（需 Token）
exports.create = async (req, res) => {
  const id = await categoryService.createCategory(parseName(req.body));
  success(res, { id }, '新增成功');
};

// PUT /api/admin/categories/:id 修改分类（需 Token）
exports.update = async (req, res) => {
  await categoryService.updateCategory(Number(req.params.id), parseName(req.body));
  success(res, null, '修改成功');
};

// DELETE /api/admin/categories/:id 删除分类（需 Token）
exports.remove = async (req, res) => {
  await categoryService.deleteCategory(Number(req.params.id));
  success(res, null, '删除成功');
};
