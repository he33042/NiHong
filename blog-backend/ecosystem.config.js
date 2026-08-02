// PM2 部署配置
// 启动：pm2 start ecosystem.config.js
// 常用命令：pm2 list / pm2 logs blog-backend / pm2 restart blog-backend / pm2 stop blog-backend
module.exports = {
  apps: [
    {
      name: 'blog-backend',          // 应用名称
      script: 'src/server.js',       // 入口文件
      instances: 1,                  // 实例数，单机 MySQL 连接池建议 1；多核可改 'max'
      exec_mode: 'fork',             // fork 模式（配合单实例）
      autorestart: true,             // 崩溃自动重启
      watch: false,                  // 生产环境不监听文件变化
      max_memory_restart: '300M',    // 内存超限自动重启
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'logs/err.log',    // 错误日志
      out_file: 'logs/out.log',      // 输出日志
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
