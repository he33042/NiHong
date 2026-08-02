<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ArrowLeft, CalendarDays, LogIn, MessageSquare, Send } from 'lucide-vue-next'
import { MdPreview } from 'md-editor-v3'
import { toast } from 'vue-sonner'
import { createComment, fetchArticle, fetchComments, type ArticleComment } from '@/api'
import type { Article } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { nameColor } from '@/lib/utils'
import { useThemeStore } from '@/stores/theme'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const theme = useThemeStore()
const userStore = useUserStore()

const article = ref<Article | null>(null)
const loading = ref(true)

// ===== 视频嵌入解析 =====
function parseVideoEmbed(url: string): string | null {
  if (!url) return null
  // YouTube: https://www.youtube.com/watch?v=VIDEO_ID 或 https://youtu.be/VIDEO_ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/)
  if (ytMatch) {
    return `<iframe class="w-full aspect-video rounded-xl border border-primary/15" src="https://www.youtube.com/embed/${ytMatch[1]}" allowfullscreen loading="lazy" />`
  }
  // Bilibili: https://www.bilibili.com/video/BVxxxxx 或 https://b23.tv/xxx
  const biliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/)
  if (biliMatch) {
    return `<iframe class="w-full aspect-video rounded-xl border border-primary/15" src="https://player.bilibili.com/player.html?bvid=${biliMatch[1]}&page=1&high_quality=1" allowfullscreen loading="lazy" />`
  }
  // 通用视频直链 (.mp4, .webm, .ogg)
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return `<video class="w-full rounded-xl border border-primary/15" controls><source src="${url}" type="video/mp4" /></video>`
  }
  return null
}
const videoEmbed = ref<string | null>(null)

// 阅读进度条：跟随页面滚动，顶部渐变细条
const progress = ref(0)
function onScroll() {
  const el = document.documentElement
  const max = el.scrollHeight - el.clientHeight
  progress.value = max > 0 ? Math.min(1, el.scrollTop / max) : 0
}

// ===== 评论区 =====
const comments = ref<ArticleComment[]>([])
const content = ref('')
const sending = ref(false)

async function loadComments(articleId: number) {
  try {
    comments.value = await fetchComments(articleId)
  } catch {
    comments.value = []
  }
}

async function submitComment() {
  const text = content.value.trim()
  if (!text) {
    toast.error('请填写评论内容')
    return
  }
  if (text.length > 500) {
    toast.error('评论不超过 500 字')
    return
  }
  sending.value = true
  try {
    await createComment(Number(route.params.id), { content: text })
    toast.success('评论成功')
    content.value = ''
    loadComments(Number(route.params.id))
  } catch {
    // 错误提示已由 axios 拦截器统一处理
  } finally {
    sending.value = false
  }
}

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  try {
    article.value = await fetchArticle(Number(route.params.id))
    videoEmbed.value = parseVideoEmbed(article.value.video_url || '')
    loadComments(article.value.id)
  } catch {
    article.value = null // 错误提示已由 axios 拦截器统一处理
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <!-- 阅读进度条：青→粉→紫渐变，随滚动推进 -->
  <div class="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent">
    <div
      class="h-full bg-gradient-to-r from-primary via-sakura to-secondary shadow-[0_0_8px_hsl(var(--primary)/0.6)] transition-[width] duration-150"
      :style="{ width: `${progress * 100}%` }"
    />
  </div>

  <!-- 文章详情：Markdown 正文渲染，主题跟随明暗模式 -->
  <article v-if="article" class="mx-auto flex max-w-3xl animate-fade-up flex-col gap-8">
    <button
      class="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
      @click="router.back()"
    >
      <ArrowLeft class="h-3.5 w-3.5" />返回
    </button>

    <header class="flex flex-col gap-5">
      <h1 class="font-display text-3xl leading-snug tracking-wide md:text-4xl">{{ article.title }}</h1>
      <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span class="inline-flex items-center gap-1">
          <CalendarDays class="h-3.5 w-3.5" />{{ dayjs(article.created_at).format('YYYY-MM-DD') }}
        </span>
        <Badge v-if="article.category_name">{{ article.category_name }}</Badge>
        <span v-for="t in article.tags" :key="t.id" class="chip !px-2 !py-0.5"># {{ t.name }}</span>
      </div>
      <div class="cyber-line" />
    </header>

    <img
      v-if="article.cover"
      :src="article.cover"
      :alt="article.title"
      class="w-full rounded-xl border border-primary/15 object-cover"
    />

    <!-- 视频嵌入 -->
    <div v-if="videoEmbed" class="overflow-hidden rounded-xl" v-html="videoEmbed" />

    <!-- Markdown 渲染（背景透明以融入全局风格） -->
    <MdPreview
      :modelValue="article.content"
      :theme="theme.mode"
      editorId="article-preview"
      :style="{ '--md-bk-color': 'transparent' }"
    />

    <!-- ================= 评论区 ================= -->
    <section class="flex flex-col gap-6 border-t border-primary/10 pt-10">
      <div class="flex items-center gap-2">
        <MessageSquare class="h-4 w-4 text-primary" />
        <h2 class="font-display text-xl tracking-wide">评论</h2>
        <span class="text-xs text-muted-foreground">{{ comments.length }} 条</span>
      </div>

      <!-- 评论表单 -->
      <div v-if="userStore.isLoggedIn" class="neon-card flex flex-col gap-3 p-5">
        <div class="flex items-center gap-2 text-sm text-muted-foreground">
          以 <span class="font-medium text-primary">{{ userStore.user?.nickname }}</span> 的身份评论
        </div>
        <Textarea v-model="content" placeholder="写下你的想法…（500 字以内）" :rows="3" maxlength="500" />
        <div class="flex justify-end">
          <Button size="sm" :disabled="sending" @click="submitComment">
            <Send class="h-4 w-4" />{{ sending ? '发送中…' : '发表评论' }}
          </Button>
        </div>
      </div>
      <!-- 未登录提示 -->
      <div v-else class="neon-card flex flex-col items-center gap-3 p-6 text-center">
        <LogIn class="h-8 w-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">登录后可发表评论</p>
        <Button variant="outline" size="sm" @click="router.push('/user/login')">
          <LogIn class="mr-1 h-3.5 w-3.5" />去登录
        </Button>
      </div>

      <!-- 评论列表 -->
      <div v-if="comments.length" class="flex flex-col gap-3">
        <div v-for="c in comments" :key="c.id" class="msg-card">
          <span
            class="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-lg border font-display"
            :class="nameColor(c.nickname)"
          >
            {{ c.nickname.charAt(0) }}
          </span>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <div class="flex items-baseline gap-3">
              <span class="text-sm font-medium">{{ c.nickname }}</span>
              <span class="text-xs text-muted-foreground">{{ dayjs(c.created_at).format('YYYY-MM-DD HH:mm') }}</span>
            </div>
            <p class="whitespace-pre-wrap break-words text-sm text-muted-foreground">{{ c.content }}</p>
          </div>
        </div>
      </div>
      <p v-else class="py-6 text-center text-xs tracking-widest text-muted-foreground">暂无评论，来抢沙发</p>
    </section>
  </article>

  <!-- 加载骨架屏 -->
  <div v-else-if="loading" class="mx-auto flex max-w-3xl flex-col gap-4">
    <Skeleton class="h-8 w-2/3" />
    <Skeleton class="h-4 w-1/3" />
    <Skeleton class="h-64 w-full" />
  </div>

  <!-- 文章不存在 / 未发布 -->
  <div v-else class="flex flex-col items-center gap-4 py-24 text-muted-foreground">
    <p class="font-display text-lg tracking-widest">SIGNAL LOST</p>
    <p class="text-xs tracking-widest">文章不存在或未发布</p>
    <Button variant="outline" size="sm" @click="router.push('/')">回到首页</Button>
  </div>
</template>
