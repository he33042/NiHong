const router = require('express').Router();
const auth = require('../middlewares/auth');
const ah = require('../utils/asyncHandler');
const adminController = require('../controllers/adminController');
const articleController = require('../controllers/articleController');
const categoryController = require('../controllers/categoryController');
const tagController = require('../controllers/tagController');
const messageController = require('../controllers/messageController');
const statsController = require('../controllers/statsController');
const attachmentController = require('../controllers/attachmentController');
const commentController = require('../controllers/commentController');
const settingController = require('../controllers/settingController');
const aiController = require('../controllers/aiController');

// ==================== 后台管理接口 ====================

// 管理员登录（无需 Token，严格限流防爆破）
router.post('/login', (req, res, next) => req.app.locals.strictLimiter(req, res, next), ah(adminController.login));

// 以下接口全部需要 Token 鉴权，未登录返回 401
router.use(auth);

// 仪表盘统计
router.get('/stats', ah(statsController.get));

// 留言管理：列表 / 删除 / 回复
router.get('/messages', ah(messageController.list));
router.delete('/messages/:id', ah(messageController.remove));
router.post('/messages/:id/reply', ah(messageController.reply));

// 评论管理：列表 / 删除 / 回复
router.get('/comments', ah(commentController.adminList));
router.delete('/comments/:id', ah(commentController.remove));
router.post('/comments/:id/reply', ah(commentController.reply));

// 附件管理：上传 / 列表 / 删除
router.post('/attachments', attachmentController.upload);
router.get('/attachments', ah(attachmentController.list));
router.delete('/attachments/:id', ah(attachmentController.remove));

// 站点配置（站点设置 / AI 配置）
router.get('/settings', ah(settingController.getAll));
router.get('/settings/ai-secrets', ah(settingController.getAiSecrets));
router.put('/settings/:key', ah(settingController.upsert));

// AI 对话代理（避免浏览器 CORS，保护 API Key）
router.post('/ai/chat', ah(aiController.chat));

// 文章：列表（含草稿）/ 详情（编辑回显）/ 新增 / 修改 / 删除 / 状态切换
router.get('/articles', ah(articleController.adminList));
router.get('/articles/:id', ah(articleController.adminDetail));
router.post('/articles', ah(articleController.create));
router.put('/articles/:id', ah(articleController.update));
router.patch('/articles/:id/status', ah(articleController.updateStatus));
router.delete('/articles/:id', ah(articleController.remove));

// 分类：新增 / 修改 / 删除
router.post('/categories', ah(categoryController.create));
router.put('/categories/:id', ah(categoryController.update));
router.delete('/categories/:id', ah(categoryController.remove));

// 标签：新增 / 修改 / 删除
router.post('/tags', ah(tagController.create));
router.put('/tags/:id', ah(tagController.update));
router.delete('/tags/:id', ah(tagController.remove));

module.exports = router;
