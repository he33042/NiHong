<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut, Search, Settings, User } from 'lucide-vue-next'
import ThemeToggle from './ThemeToggle.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AVATAR_IMG } from '@/lib/assets'
import { useUserStore } from '@/stores/user'

import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const userStore = useUserStore()
const settings = useSettingsStore()
settings.load()
const isAdmin = () => !!(localStorage.getItem('blog_token') && localStorage.getItem('blog_admin'))

// 滚动感知
const scrolled = ref(false)
function onScroll() {
  scrolled.value = window.scrollY > 24
}
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

// 搜索面板
const searchOpen = ref(false)
const keyword = ref('')
const searchInput = ref<{ $el: HTMLInputElement }>()

async function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) {
    await nextTick()
    searchInput.value?.$el?.focus()
  }
}

function submitSearch() {
  const q = keyword.value.trim()
  if (!q) return
  router.push({ path: '/search', query: { q } })
  searchOpen.value = false
  keyword.value = ''
}

function onSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') searchOpen.value = false
}

function handleLogout() {
  userStore.logout()
  router.push('/')
}
</script>

<template>
  <!-- 悬浮式玻璃胶囊导航：透明磨砂 + 渐变描边，随滚动加深 -->
  <header class="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
    <div
      class="nav-glass relative flex h-14 w-full max-w-4xl items-center justify-between rounded-2xl px-4 md:px-6"
      :class="{ 'nav-scrolled': scrolled }"
    >
      <!-- Logo：博主头像 + 站名 -->
      <RouterLink to="/" class="flex items-center gap-2.5">
        <img
          :src="settings.avatar || AVATAR_IMG"
          alt="博主头像"
          class="h-8 w-8 rounded-lg border border-sakura/50 object-cover shadow-[0_0_12px_hsl(var(--sakura)/0.35)]"
        />
        <span class="flex flex-col leading-none">
          <span class="glow-text font-display text-lg tracking-widest">{{ settings.siteName }}</span>
          <span class="mt-0.5 text-[9px] tracking-[0.35em] text-muted-foreground">NEON LOG</span>
        </span>
      </RouterLink>

      <div class="flex items-center gap-1.5">
        <RouterLink to="/">
          <Button variant="ghost" size="sm">首页</Button>
        </RouterLink>
        <RouterLink to="/categories" class="hidden sm:block">
          <Button variant="ghost" size="sm">分类</Button>
        </RouterLink>
        <RouterLink to="/tags" class="hidden sm:block">
          <Button variant="ghost" size="sm">标签</Button>
        </RouterLink>
        <RouterLink to="/about" class="hidden sm:block">
          <Button variant="ghost" size="sm">关于</Button>
        </RouterLink>
        <RouterLink to="/guestbook" class="hidden sm:block">
          <Button variant="ghost" size="sm">留言</Button>
        </RouterLink>

        <!-- 搜索按钮：点击展开搜索面板 -->
        <Button
          variant="ghost"
          size="icon"
          aria-label="搜索文章"
          :class="{ 'bg-primary/10 text-primary': searchOpen }"
          @click="toggleSearch"
        >
          <Search class="h-4 w-4" />
        </Button>

        <ThemeToggle />

        <!-- 已登录用户 -->
        <template v-if="userStore.isLoggedIn">
          <span class="hidden text-xs text-muted-foreground sm:inline">
            {{ userStore.user?.nickname }}
          </span>
          <Button variant="ghost" size="icon" aria-label="退出登录" @click="handleLogout">
            <LogOut class="h-4 w-4" />
          </Button>
          <RouterLink v-if="isAdmin()" to="/admin">
            <Button variant="outline" size="sm">
              <Settings class="mr-1 h-3.5 w-3.5" />控制台
            </Button>
          </RouterLink>
        </template>
        <!-- 未登录：登录按钮 -->
        <template v-else>
          <RouterLink to="/user/login">
            <Button variant="outline" size="sm">
              <User class="mr-1 h-3.5 w-3.5" />登录
            </Button>
          </RouterLink>
        </template>
      </div>

      <!-- 搜索面板：玻璃质感下拉，回车跳转 /search -->
      <Transition name="page">
        <div
          v-if="searchOpen"
          class="nav-glass absolute right-0 top-[calc(100%+10px)] flex w-[min(20rem,calc(100vw-2rem))] items-center gap-2 rounded-xl p-2"
        >
          <Input
            ref="searchInput"
            v-model="keyword"
            placeholder="搜索文章标题 / 简介…"
            class="h-8 border-0 bg-transparent focus-visible:ring-0"
            @keydown="onSearchKeydown"
            @keyup.enter="submitSearch"
          />
          <Button size="sm" class="shrink-0" @click="submitSearch">搜索</Button>
        </div>
      </Transition>
    </div>
  </header>
</template>
