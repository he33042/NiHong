<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2, LogIn, Mail, User, UserPlus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useUserStore } from '@/stores/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const router = useRouter()
const userStore = useUserStore()

const tab = ref<'login' | 'register'>('login')
const loading = ref(false)

// 登录表单
const loginForm = reactive({ email: '', password: '' })
// 注册表单
const registerForm = reactive({ email: '', password: '', nickname: '', confirmPassword: '' })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(email: string): string | null {
  if (!email.trim()) return '请输入邮箱'
  if (!EMAIL_RE.test(email.trim())) return '邮箱格式不正确'
  return null
}

async function doLogin() {
  const emailErr = validateEmail(loginForm.email)
  if (emailErr) { toast.error(emailErr); return }
  if (!loginForm.password) { toast.error('请输入密码'); return }

  loading.value = true
  try {
    await userStore.login(loginForm.email.trim(), loginForm.password)
    toast.success('登录成功')
    router.push('/')
  } catch {
    // 错误提示已由 axios 拦截器统一处理
  } finally {
    loading.value = false
  }
}

async function doRegister() {
  const emailErr = validateEmail(registerForm.email)
  if (emailErr) { toast.error(emailErr); return }
  if (!registerForm.nickname.trim()) { toast.error('请输入昵称'); return }
  if (registerForm.nickname.trim().length > 20) { toast.error('昵称不能超过20个字符'); return }
  if (!registerForm.password || registerForm.password.length < 6) { toast.error('密码至少6位'); return }
  if (registerForm.password !== registerForm.confirmPassword) { toast.error('两次密码输入不一致'); return }

  loading.value = true
  try {
    await userStore.register(registerForm.email.trim(), registerForm.password, registerForm.nickname.trim())
    toast.success('注册成功，请登录')
    // 清空并切换到登录
    loginForm.email = registerForm.email
    loginForm.password = ''
    registerForm.email = ''
    registerForm.password = ''
    registerForm.nickname = ''
    registerForm.confirmPassword = ''
    tab.value = 'login'
  } catch {
    // 错误提示已由 axios 拦截器统一处理
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[70vh] items-center justify-center px-4">
    <div class="neon-card relative w-full max-w-md overflow-hidden p-8 md:p-10">
      <!-- 装饰角标 -->
      <span class="cyber-corner left-0 top-0 border-l border-t" />
      <span class="cyber-corner right-0 top-0 border-r border-t" />
      <span class="cyber-corner bottom-0 left-0 border-b border-l" />
      <span class="cyber-corner bottom-0 right-0 border-b border-r" />

      <!-- Tab 切换 -->
      <div class="mb-8 flex gap-1 rounded-lg bg-muted p-1">
        <button
          class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all"
          :class="tab === 'login' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'"
          @click="tab = 'login'"
        >
          <LogIn class="mr-1.5 inline-block h-4 w-4" />登录
        </button>
        <button
          class="flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all"
          :class="tab === 'register' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'"
          @click="tab = 'register'"
        >
          <UserPlus class="mr-1.5 inline-block h-4 w-4" />注册
        </button>
      </div>

      <!-- 登录表单 -->
      <form v-if="tab === 'login'" class="flex flex-col gap-5" @submit.prevent="doLogin">
        <div class="flex flex-col gap-2">
          <label class="flex items-center gap-1.5 text-xs tracking-widest text-muted-foreground">
            <Mail class="h-3.5 w-3.5" />邮箱
          </label>
          <Input v-model="loginForm.email" type="email" placeholder="your@email.com" autocomplete="email" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-xs tracking-widest text-muted-foreground">密码</label>
          <Input v-model="loginForm.password" type="password" placeholder="输入密码" autocomplete="current-password" />
        </div>
        <Button type="submit" class="w-full" :disabled="loading">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <LogIn v-else class="h-4 w-4" />
          {{ loading ? '登录中…' : '登 录' }}
        </Button>
      </form>

      <!-- 注册表单 -->
      <form v-else class="flex flex-col gap-4" @submit.prevent="doRegister">
        <div class="flex flex-col gap-2">
          <label class="flex items-center gap-1.5 text-xs tracking-widest text-muted-foreground">
            <Mail class="h-3.5 w-3.5" />邮箱 *
          </label>
          <Input v-model="registerForm.email" type="email" placeholder="your@email.com" autocomplete="email" />
          <p class="text-[10px] text-muted-foreground">请确保邮箱格式正确，用于登录和找回密码</p>
        </div>
        <div class="flex flex-col gap-2">
          <label class="flex items-center gap-1.5 text-xs tracking-widest text-muted-foreground">
            <User class="h-3.5 w-3.5" />昵称 *
          </label>
          <Input v-model="registerForm.nickname" placeholder="你的昵称（20字以内）" maxlength="20" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <label class="text-xs tracking-widest text-muted-foreground">密码 *</label>
            <Input v-model="registerForm.password" type="password" placeholder="至少6位" autocomplete="new-password" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs tracking-widest text-muted-foreground">确认密码 *</label>
            <Input v-model="registerForm.confirmPassword" type="password" placeholder="再次输入密码" autocomplete="new-password" />
          </div>
        </div>
        <Button type="submit" class="w-full" :disabled="loading">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          <UserPlus v-else class="h-4 w-4" />
          {{ loading ? '注册中…' : '注 册' }}
        </Button>
      </form>
    </div>
  </div>
</template>
