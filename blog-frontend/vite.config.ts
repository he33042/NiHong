import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    port: 5173,
    proxy: {
      // 开发环境将 /api 代理到后端服务（默认 3000 端口）
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      // 上传的附件静态目录同样走代理
      '/uploads': { target: 'http://localhost:3000', changeOrigin: true }
    }
  }
})
