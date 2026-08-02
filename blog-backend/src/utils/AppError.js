// 自定义业务异常：携带 HTTP 状态码，由全局异常处理器统一转换为 JSON 返回
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
