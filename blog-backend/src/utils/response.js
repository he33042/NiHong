// 统一 JSON 返回格式
// 成功：{ code: 0, message: 'success', data: ... }
// 失败：{ code: HTTP状态码, message: '错误信息' }（由全局异常处理器输出）
exports.success = (res, data = null, message = 'success') => {
  res.json({ code: 0, message, data });
};
