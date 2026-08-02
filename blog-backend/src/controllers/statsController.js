const statsService = require('../services/statsService');
const { success } = require('../utils/response');

// GET /api/admin/stats 仪表盘统计（需登录）
exports.get = async (req, res) => {
  success(res, await statsService.getStats());
};
