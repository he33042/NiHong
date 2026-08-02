import axios from 'axios'
import { toast } from 'vue-sonner'
import router from '@/router'

// axios 统一封装：
// 1. baseURL=/api（开发环境由 Vite 代理到后端）
// 2. 请求自动携带登录 Token
// 3. 统一解包 { code, message, data }
// 4. 401 未登录自动清理登录态并跳转登录页
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 15000,
  withCredentials: true // 发送 HttpOnly Cookie
})

// 请求拦截：自动携带 Token（管理员接口用管理员token，用户接口用用户token）
http.interceptors.request.use((config) => {
  const userToken = localStorage.getItem('blog_user_token')
  const adminToken = localStorage.getItem('blog_token')
  // 管理后台接口优先使用管理员 token，前台接口使用用户 token
  const isAdminApi = config.url?.startsWith('/admin/') || config.url === '/admin'
  if (isAdminApi && adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`
    ;(config as any)._tokenType = 'admin'
  } else if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`
    ;(config as any)._tokenType = 'user'
  }
  // 注意：非管理接口不使用 admin token 兜底，避免 role 校验失败
  return config
})

// 响应拦截：解包统一返回格式 + 集中错误处理
http.interceptors.response.use(
  (res) => {
    const body = res.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) return body.data
      toast.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message))
    }
    return body
  },
  (err) => {
    const status = err.response?.status
    const message = err.response?.data?.message || err.message || '网络异常'
    if (status === 401) {
      const tokenType = (err.config as any)?._tokenType
      if (tokenType === 'user') {
        // 仅清除用户 token，不影响管理员登录态
        localStorage.removeItem('blog_user_token')
        localStorage.removeItem('blog_user_info')
        if (router.currentRoute.value.path !== '/user/login') {
          toast.error('登录已过期，请重新登录')
          router.push('/user/login')
        }
      } else if (tokenType === 'admin') {
        // 仅清除管理员 token，不影响用户登录态
        localStorage.removeItem('blog_token')
        localStorage.removeItem('blog_admin')
        if (router.currentRoute.value.path !== '/login') {
          toast.error('登录已过期，请重新登录')
          router.push({ path: '/login', query: { redirect: router.currentRoute.value.fullPath } })
        }
      } else {
        // 未携带 token 却返回 401，清除所有登录态兜底
        localStorage.removeItem('blog_user_token')
        localStorage.removeItem('blog_user_info')
        localStorage.removeItem('blog_token')
        localStorage.removeItem('blog_admin')
      }
    } else {
      toast.error(message)
    }
    return Promise.reject(new Error(message))
  }
)

export default http
