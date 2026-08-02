<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { FileText, FolderOpen, MessageCircle, Tags } from 'lucide-vue-next'
import { adminFetchArticles, fetchMessages, fetchStats, type Stats } from '@/api'
import type { Article, Message } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { nameColor } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const stats = ref<Stats | null>(null)
const latestArticles = ref<Article[]>([])
const latestMessages = ref<Message[]>([])
const loading = ref(true)

// 按时段生成问候语
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})

// 统计卡片配置
const cards = computed(() => {
  if (!stats.value) return []
  const s = stats.value
  return [
    { label: '文章', value: s.article.total, sub: `已发布 ${s.article.published} · 草稿 ${s.article.draft}`, icon: FileText, to: '/admin/articles' },
    { label: '分类', value: s.categories, sub: '文章分类', icon: FolderOpen, to: '/admin/categories' },
    { label: '标签', value: s.tags, sub: '文章标签', icon: Tags, to: '/admin/tags' },
    { label: '留言', value: s.messages, sub: '访客留言', icon: MessageCircle, to: '/admin/messages' }
  ]
})

onMounted(async () => {
  try {
    const [s, a, m] = await Promise.all([
      fetchStats(),
      adminFetchArticles({ page: 1, size: 5 }),
      fetchMessages({ page: 1, size: 5 })
    ])
    stats.value = s
    latestArticles.value = a.list
    latestMessages.value = m.list
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="flex flex-col gap-10">
    <!-- 欢迎头 -->
    <div>
      <h1 class="font-display text-2xl tracking-wide">{{ greeting }}，{{ auth.admin?.nickname || '博主' }}</h1>
      <p class="mt-1 text-xs text-muted-foreground">这里是 NEON·LOG 控制台概览</p>
    </div>

    <!-- 统计卡片 -->
    <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <Skeleton v-for="i in 4" :key="i" class="h-28 w-full" />
    </div>
    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <button v-for="c in cards" :key="c.label" class="stat-card group" @click="router.push(c.to)">
        <div class="flex items-center justify-between">
          <span class="text-xs tracking-widest text-muted-foreground">{{ c.label }}</span>
          <span class="stat-icon"><component :is="c.icon" class="h-4 w-4" /></span>
        </div>
        <p class="mt-3 text-left font-display text-3xl">{{ c.value }}</p>
        <p class="mt-1 text-left text-xs text-muted-foreground">{{ c.sub }}</p>
      </button>
    </div>

    <!-- 最新动态：文章 + 留言 -->
    <div class="grid gap-5 lg:grid-cols-2">
      <!-- 最新文章 -->
      <div class="neon-card flex flex-col gap-3 p-6">
        <div class="mb-1 flex items-center justify-between">
          <h2 class="font-display text-lg tracking-wide">最新文章</h2>
          <RouterLink to="/admin/articles" class="text-xs text-muted-foreground transition-colors hover:text-primary">
            全部 →
          </RouterLink>
        </div>
        <Skeleton v-if="loading" v-for="i in 3" :key="i" class="h-10 w-full" />
        <template v-else>
          <button
            v-for="a in latestArticles"
            :key="a.id"
            class="flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-primary/5"
            @click="router.push(`/admin/articles/${a.id}/edit`)"
          >
            <span class="min-w-0 flex-1 truncate text-sm">{{ a.title }}</span>
            <Badge :variant="a.status === 1 ? 'default' : 'secondary'" class="shrink-0">
              {{ a.status === 1 ? '已发布' : '草稿' }}
            </Badge>
            <span class="shrink-0 text-xs text-muted-foreground">{{ dayjs(a.created_at).format('MM-DD') }}</span>
          </button>
          <p v-if="!latestArticles.length" class="py-8 text-center text-xs text-muted-foreground">暂无文章</p>
        </template>
      </div>

      <!-- 最新留言 -->
      <div class="neon-card flex flex-col gap-3 p-6">
        <div class="mb-1 flex items-center justify-between">
          <h2 class="font-display text-lg tracking-wide">最新留言</h2>
          <RouterLink to="/admin/messages" class="text-xs text-muted-foreground transition-colors hover:text-primary">
            全部 →
          </RouterLink>
        </div>
        <Skeleton v-if="loading" v-for="i in 3" :key="i" class="h-10 w-full" />
        <template v-else>
          <div v-for="m in latestMessages" :key="m.id" class="flex items-start gap-3 px-2 py-2">
            <span
              class="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border font-display text-sm"
              :class="nameColor(m.nickname)"
            >
              {{ m.nickname.charAt(0) }}
            </span>
            <div class="flex min-w-0 flex-1 flex-col">
              <div class="flex items-baseline gap-2">
                <span class="text-sm">{{ m.nickname }}</span>
                <span class="text-xs text-muted-foreground">{{ dayjs(m.created_at).format('MM-DD HH:mm') }}</span>
              </div>
              <p class="truncate text-xs text-muted-foreground">{{ m.content }}</p>
            </div>
          </div>
          <p v-if="!latestMessages.length" class="py-8 text-center text-xs text-muted-foreground">暂无留言</p>
        </template>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* 统计卡片：hover 微光上浮 */
.stat-card {
  @apply rounded-xl border border-primary/15 bg-card/60 p-5 backdrop-blur-sm transition-all duration-300;
}
.stat-card:hover {
  @apply -translate-y-0.5 border-primary/45;
  box-shadow:
    0 0 20px hsl(var(--primary) / 0.18),
    0 0 40px hsl(var(--secondary) / 0.1);
}
.stat-icon {
  @apply flex h-8 w-8 items-center justify-center rounded-lg border border-primary/40 text-primary transition-all duration-300;
  box-shadow: 0 0 10px hsl(var(--primary) / 0.25);
}
.stat-card:hover .stat-icon {
  @apply border-sakura/60 text-sakura;
  box-shadow: 0 0 14px hsl(var(--sakura) / 0.4);
}
</style>
