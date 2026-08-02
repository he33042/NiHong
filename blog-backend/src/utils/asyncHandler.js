// 包装 async 路由处理函数：自动捕获 Promise 异常并交给全局异常处理器，
// 避免每个接口都写 try/catch
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
