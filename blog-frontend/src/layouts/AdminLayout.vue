<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  FileText,
  FolderOpen,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquare,
  PenLine,
  Settings,
  Sparkles,
  Tags
} from 'lucide-vue-next'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Button } from '@/components/ui/button'
import { AVATAR_IMG } from '@/lib/assets'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const auth = useAuthStore()
const settings = useSettingsStore()
settings.load()
const router = useRouter()

// 侧边菜单
const links = [
  { to: '/admin/dashboard', label: '后台首页', icon: LayoutDashboard },
  { to: '/admin/articles', label: '文章管理', icon: FileText },
  { to: '/admin/attachments', label: '附件管理', icon: Image },
  { to: '/admin/categories', label: '分类管理', icon: FolderOpen },
  { to: '/admin/tags', label: '标签管理', icon: Tags },
  { to: '/admin/comments', label: '评论管理', icon: MessageSquare },
  { to: '/admin/messages', label: '留言管理', icon: MessageCircle },
  { to: '/admin/ai', label: 'AI 配置', icon: Sparkles },
  { to: '/admin/ai-writer', label: 'AI 写作', icon: PenLine },
  { to: '/admin/settings', label: '站点设置', icon: Settings }
]

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen flex-col md:flex-row">
    <!-- 侧边栏：移动端折叠为顶部横向导航 -->
    <aside
      class="flex shrink-0 flex-col border-b border-primary/10 bg-card/40 backdrop-blur md:h-screen md:w-60 md:border-b-0 md:border-r"
    >
      <!-- 博主信息区 -->
      <div class="flex items-center gap-3 border-b border-primary/10 p-5">
        <img
          :src="settings.avatar || AVATAR_IMG"
          alt="博主头像"
          class="h-10 w-10 rounded-xl border border-sakura/40 object-cover shadow-[0_0_14px_hsl(var(--sakura)/0.35)]"
        />
        <div class="flex min-w-0 flex-col">
          <span class="glow-text truncate font-display text-base tracking-widest">{{ settings.siteName }}</span>
          <span class="mt-0.5 text-[10px] tracking-[0.25em] text-muted-foreground">
            {{ auth.admin?.nickname || 'ADMIN' }} · 已登录
          </span>
        </div>
      </div>

      <!-- 菜单：移动端横向滚动，桌面端纵向 -->
      <nav class="flex gap-1.5 overflow-x-auto p-3 md:flex-1 md:flex-col md:overflow-visible md:p-4">
        <RouterLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="nav-item"
          active-class="nav-item-active"
        >
          <component :is="l.icon" class="h-4 w-4 shrink-0" />
          <span class="whitespace-nowrap">{{ l.label }}</span>
        </RouterLink>
      </nav>

      <!-- 底部操作区（桌面端） -->
      <div class="mt-auto hidden flex-col gap-1 border-t border-primary/10 p-4 md:flex">
        <RouterLink to="/" class="nav-item">
          <Home class="h-4 w-4 shrink-0" /><span>返回前台</span>
        </RouterLink>
        <button class="nav-item w-full text-left" @click="logout">
          <LogOut class="h-4 w-4 shrink-0" /><span>退出登录</span>
        </button>
      </div>
    </aside>

    <div class="flex flex-1 flex-col">
      <!-- 顶栏：移动端显示全部操作，桌面端仅标题与主题 -->
      <header class="flex h-14 items-center justify-between border-b border-primary/10 px-4 md:px-6">
        <span class="text-xs tracking-widest text-muted-foreground">NEON·LOG 管理后台</span>
        <div class="flex items-center gap-1">
          <ThemeToggle />
          <RouterLink to="/" class="md:hidden">
            <Button variant="ghost" size="icon" aria-label="返回前台"><Home class="h-4 w-4" /></Button>
          </RouterLink>
          <Button variant="ghost" size="icon" class="md:hidden" aria-label="退出登录" @click="logout">
            <LogOut class="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main class="flex-1 p-4 md:p-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 侧边菜单项：hover 微光，激活态霓虹描边 */
.nav-item {
  @apply flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary;
}
.nav-item-active {
  @apply border border-primary/40 bg-primary/10 text-primary;
  box-shadow:
    0 0 14px hsl(var(--primary) / 0.25),
    inset 0 0 12px hsl(var(--primary) / 0.06);
}
</style>
