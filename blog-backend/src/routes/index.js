const router = require('express').Router();

// 路由汇总：/api/admin/* 为后台接口，其余 /api/* 为前台公开接口
router.use('/api/admin', require('./admin.routes'));
router.use('/api', require('./public.routes'));

module.exports = router;
