const router = require('express').Router();
const ah = require('../utils/asyncHandler');
const userAuth = require('../middlewares/userAuth');
const articleController = require('../controllers/articleController');
const categoryController = require('../controllers/categoryController');
const tagController = require('../controllers/tagController');
const messageController = require('../controllers/messageController');
const commentController = require('../controllers/commentController');
const userController = require('../controllers/userController');
const settingController = require('../controllers/settingController');

// ==================== 前台公开接口（无需 Token） ====================

// 分页获取文章列表，支持 categoryId / tagId 筛选
router.get('/articles', ah(articleController.list));
// 单篇文章详情
router.get('/articles/:id', ah(articleController.detail));
// 分类 / 标签列表（供前台筛选导航）
router.get('/categories', ah(categoryController.list));
router.get('/tags', ah(tagController.list));
// 留言板：列表（公开）+ 提交（需登录，限流）
router.get('/messages', ah(messageController.list));
router.post('/messages', userAuth, (req, res, next) => req.app.locals.postLimiter(req, res, next), ah(messageController.create));
// 文章评论：列表（公开）+ 提交（需登录，限流）
router.get('/articles/:id/comments', ah(commentController.listByArticle));
router.post('/articles/:id/comments', userAuth, (req, res, next) => req.app.locals.postLimiter(req, res, next), ah(commentController.create));

// ==================== 用户系统（公开，登录/注册限流） ====================
router.post('/user/register', (req, res, next) => req.app.locals.strictLimiter(req, res, next), ah(userController.register));
router.post('/user/login', (req, res, next) => req.app.locals.strictLimiter(req, res, next), ah(userController.login));
router.get('/user/profile', userAuth, ah(userController.profile));

// ==================== 公开站点配置（无需登录，仅前台字段） ====================
router.get('/settings', ah(settingController.getPublic));

module.exports = router;
