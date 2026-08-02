import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userLogin, userRegister, userProfile } from '@/api'
import type { UserInfo } from '@/types'

const TOKEN_KEY = 'blog_user_token'
const USER_KEY = 'blog_user_info'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref<UserInfo | null>(
    (() => { try { const v = localStorage.getItem(USER_KEY); return v ? JSON.parse(v) : null } catch { return null } })()
  )

  const isLoggedIn = computed(() => !!token.value)

  function saveToken(t: string) {
    token.value = t
    localStorage.setItem(TOKEN_KEY, t)
  }

  function saveUser(u: UserInfo) {
    user.value = u
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  async function login(email: string, password: string) {
    const res = await userLogin({ email, password })
    // 普通用户登录时清除残留的管理员 token，防止误显示控制台按钮
    localStorage.removeItem('blog_token')
    localStorage.removeItem('blog_admin')
    saveToken(res.token)
    saveUser(res.user)
  }

  async function register(email: string, password: string, nickname: string) {
    const res = await userRegister({ email, password, nickname })
    return res
  }

  async function refreshProfile() {
    if (!token.value) return
    try {
      const u = await userProfile()
      saveUser(u)
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, user, isLoggedIn, login, register, refreshProfile, logout }
})
