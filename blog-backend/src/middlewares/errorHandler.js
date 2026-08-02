// 404 处理：未匹配到任何业务路由
exports.notFound = (req, res) => {
  res.status(404).json({ code: 404, message: `接口不存在: ${req.method} ${req.originalUrl}` });
};

// Multer 专用错误处理：文件大小超限 / 类型不符等 MulterError 统一转为 400
// eslint-disable-next-line no-unused-vars
exports.multerErrorHandler = (err, req, res, next) => {
  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: '文件大小不能超过 5MB',
      LIMIT_FILE_COUNT: '单次只能上传一个文件',
      LIMIT_UNEXPECTED_FILE: '上传字段名应为 file'
    };
    return res.status(400).json({
      code: 400,
      message: messages[err.code] || `文件上传失败: ${err.message}`
    });
  }
  next(err);
};

// 全局异常处理：统一捕获所有错误（含 asyncHandler 透传的 async 异常），
// 按统一 JSON 格式返回；5xx 错误只记录日志，不向前端暴露内部细节
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  if (status >= 500) {
    console.error('[服务器错误]', err);
  }
  res.status(status).json({
    code: status,
    message: status >= 500 ? '服务器内部错误' : err.message
  });
};
