const path = require('path');
const multer = require('multer');
const attachmentService = require('../services/attachmentService');
const { success } = require('../utils/response');
const AppError = require('../utils/AppError');
const ah = require('../utils/asyncHandler');

// multer 存储配置：随机文件名防冲突，保留扩展名
const storage = multer.diskStorage({
  destination: attachmentService.UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});

// 仅允许常见图片格式，单文件最大 5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new AppError(400, '仅支持图片文件（png/jpg/gif/webp/svg）'));
  }
});

// POST /api/admin/attachments 上传附件（multipart/form-data，字段名 file）
exports.upload = [
  upload.single('file'),
  ah(async (req, res) => {
    if (!req.file) throw new AppError(400, '请选择要上传的文件');
    const data = await attachmentService.createAttachment(req.file);
    success(res, data, '上传成功');
  })
];

// GET /api/admin/attachments 附件列表（分页）
exports.list = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const size = Math.min(Math.max(parseInt(req.query.size, 10) || 12, 1), 50);
  success(res, await attachmentService.listAttachments({ page, size }));
};

// DELETE /api/admin/attachments/:id 删除附件（记录 + 磁盘文件）
exports.remove = async (req, res) => {
  await attachmentService.deleteAttachment(Number(req.params.id));
  success(res, null, '删除成功');
};
