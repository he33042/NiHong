<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Lock, User } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TiltCard from '@/components/TiltCard.vue'
import { AVATAR_IMG } from '@/lib/assets'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const username = ref('')
const password = ref('')
const loading = ref(false)

// 表单校验错误（字段级提示）
const errors = reactive({ username: '', password: '' })
// 校验失败时的抖动动画开关
const shaking = ref(false)

function validate(): boolean {
  errors.username = username.value.trim() ? '' : '请输入账号'
  errors.password = password.value ? '' : '请输入密码'
  return !errors.username && !errors.password
}

async function submit() {
  if (!validate()) {
    // 校验失败：卡片抖动提示
    shaking.value = true
    setTimeout(() => (shaking.value = false), 450)
    return
  }
  loading.value = true
  try {
    await auth.login(username.value.trim(), password.value)
    // 登录成功：token 已写入 localStorage（auth store），回跳来源页或进入后台首页
    router.push((route.query.redirect as string) || '/admin')
  } catch {
    // 账号密码错误等提示已由 axios 拦截器统一 toast
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
    <!-- 简约背景装饰：两团柔光（底层 3D 星尘背景由全局提供） -->
    <div class="deco-orb left-[12%] top-[18%] bg-primary/20" aria-hidden="true" />
    <div class="deco-orb bottom-[14%] right-[10%] bg-sakura/15" aria-hidden="true" style="animation-delay: -4s" />

    <!-- 3D 线框立方体装饰（宽屏显示，不遮挡内容） -->
    <div class="cube-wrap left-[10%] top-[16%] hidden lg:block" aria-hidden="true">
      <div class="cube">
        <span class="cube-face cube-front" /><span class="cube-face cube-back" />
        <span class="cube-face cube-right" /><span class="cube-face cube-left" />
        <span class="cube-face cube-top" /><span class="cube-face cube-bottom" />
      </div>
    </div>
    <div class="cube-wrap cube-sm bottom-[14%] right-[8%] hidden lg:block" aria-hidden="true">
      <div class="cube cube-pink">
        <span class="cube-face cube-front" /><span class="cube-face cube-back" />
        <span class="cube-face cube-right" /><span class="cube-face cube-left" />
        <span class="cube-face cube-top" /><span class="cube-face cube-bottom" />
      </div>
    </div>

    <!-- 登录卡片：3D 倾斜 + 赛博旋转光束边框 -->
    <TiltCard class="w-full max-w-sm animate-fade-up">
      <div class="login-frame" :class="{ 'animate-shake': shaking }">
        <div class="relative z-10 rounded-[15px] bg-card/85 p-8 backdrop-blur-xl">
          <!-- 头部：头像 + 渐变标题 -->
          <div class="mb-8 flex flex-col items-center gap-4">
            <img
              :src="AVATAR_IMG"
              alt="博主头像"
              class="h-16 w-16 rounded-2xl border border-sakura/40 object-cover shadow-[0_0_24px_hsl(var(--sakura)/0.45)]"
            />
            <div class="flex flex-col items-center gap-1.5">
              <h1
                class="bg-gradient-to-r from-primary via-sakura to-secondary bg-clip-text font-display text-2xl tracking-widest text-transparent"
              >
                登录控制台
              </h1>
              <p class="text-xs tracking-[0.3em] text-muted-foreground">ACCESS · NEON LOG CONSOLE</p>
            </div>
          </div>

          <!-- 登录表单 -->
          <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
            <div>
              <div class="relative">
                <User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  v-model="username"
                  placeholder="账号"
                  autocomplete="username"
                  class="pl-9"
                  :class="{ 'border-destructive': errors.username }"
                  @input="errors.username = ''"
                />
              </div>
              <p v-if="errors.username" class="mt-1.5 text-xs text-destructive">{{ errors.username }}</p>
            </div>

            <div>
              <div class="relative">
                <Lock class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  v-model="password"
                  type="password"
                  placeholder="密码"
                  autocomplete="current-password"
                  class="pl-9"
                  :class="{ 'border-destructive': errors.password }"
                  @input="errors.password = ''"
                />
              </div>
              <p v-if="errors.password" class="mt-1.5 text-xs text-destructive">{{ errors.password }}</p>
            </div>

            <Button type="submit" class="mt-2 w-full" size="lg" :disabled="loading">
              {{ loading ? '验证中…' : '登 录' }}
            </Button>
          </form>

          <div class="cyber-line mt-6" />
          <RouterLink
            to="/"
            class="mt-4 block text-center text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            ← 返回博客首页
          </RouterLink>
        </div>
      </div>
    </TiltCard>
  </div>
</template>

<style scoped>
/* ===== 赛博旋转光束边框：conic 渐变绕卡片旋转一圈 ===== */
.login-frame {
  position: relative;
  overflow: hidden;
  border-radius: 1rem;
  padding: 1px;
}
.login-frame::before {
  content: '';
  position: absolute;
  inset: -100%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg 230deg,
    hsl(var(--primary) / 0.9) 290deg,
    hsl(var(--sakura) / 0.9) 330deg,
    transparent 360deg
  );
  animation: spin-border 4.5s linear infinite;
}
@keyframes spin-border {
  to {
    transform: rotate(360deg);
  }
}

/* ===== 校验失败抖动 ===== */
.animate-shake {
  animation: shake 0.4s ease;
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-6px);
  }
  75% {
    transform: translateX(6px);
  }
}

/* ===== 背景柔光斑（缓慢呼吸） ===== */
.deco-orb {
  position: absolute;
  width: 16rem;
  height: 16rem;
  border-radius: 9999px;
  filter: blur(100px);
  pointer-events: none;
  animation: orb-breathe 8s ease-in-out infinite;
}
@keyframes orb-breathe {
  0%,
  100% {
    opacity: 0.7;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

/* ===== 3D 线框立方体装饰 ===== */
.cube-wrap {
  position: absolute;
  width: 84px;
  height: 84px;
  perspective: 600px;
  opacity: 0.35;
  pointer-events: none;
}
.cube-sm {
  width: 56px;
  height: 56px;
}
.cube {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: spin-cube 18s linear infinite;
}
.cube-face {
  position: absolute;
  inset: 0;
  border: 1px solid hsl(var(--primary) / 0.7);
  background: hsl(var(--primary) / 0.04);
  box-shadow: inset 0 0 12px hsl(var(--primary) / 0.25);
}
.cube-pink .cube-face {
  border-color: hsl(var(--sakura) / 0.7);
  background: hsl(var(--sakura) / 0.04);
  box-shadow: inset 0 0 12px hsl(var(--sakura) / 0.25);
}
.cube-front { transform: translateZ(42px); }
.cube-back { transform: rotateY(180deg) translateZ(42px); }
.cube-right { transform: rotateY(90deg) translateZ(42px); }
.cube-left { transform: rotateY(-90deg) translateZ(42px); }
.cube-top { transform: rotateX(90deg) translateZ(42px); }
.cube-bottom { transform: rotateX(-90deg) translateZ(42px); }
.cube-sm .cube-front { transform: translateZ(28px); }
.cube-sm .cube-back { transform: rotateY(180deg) translateZ(28px); }
.cube-sm .cube-right { transform: rotateY(90deg) translateZ(28px); }
.cube-sm .cube-left { transform: rotateY(-90deg) translateZ(28px); }
.cube-sm .cube-top { transform: rotateX(90deg) translateZ(28px); }
.cube-sm .cube-bottom { transform: rotateX(-90deg) translateZ(28px); }
@keyframes spin-cube {
  from {
    transform: rotateX(-20deg) rotateY(0deg);
  }
  to {
    transform: rotateX(-20deg) rotateY(360deg);
  }
}

/* 尊重系统减弱动态偏好 */
@media (prefers-reduced-motion: reduce) {
  .login-frame::before,
  .cube,
  .deco-orb {
    animation: none;
  }
}
</style>
