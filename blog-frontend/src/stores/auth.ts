import { defineStore } from 'pinia'
import { ref } from 'vue'
import { loginApi } from '@/api'
import type { AdminInfo } from '@/types'

const TOKEN_KEY = 'blog_token'
const ADMIN_KEY = 'blog_admin'

// 登录状态：token + 管理员信息，持久化到 localStorage
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const admin = ref<AdminInfo | null>(JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null'))

  async function login(username: string, password: string) {
    const res = await loginApi({ username, password })
    token.value = res.token
    admin.value = res.admin
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(ADMIN_KEY, JSON.stringify(res.admin))
  }

  function logout() {
    token.value = ''
    admin.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ADMIN_KEY)
  }

  return { token, admin, login, logout }
})
