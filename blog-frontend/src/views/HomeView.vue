<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ArrowDown, ChevronDown, Sparkles, Zap } from 'lucide-vue-next'
import { fetchArticles, fetchCategories, fetchTags } from '@/api'
import type { Article, Category, Tag } from '@/types'
import ArticleCard from '@/components/ArticleCard.vue'
import Pagination from '@/components/Pagination.vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useSettingsStore } from '@/stores/settings'

// ===== Hero 视差：不同深度层随鼠标平移，营造 3D 景深 =====
const visual = ref<HTMLElement>()
const hx = ref(0)
const hy = ref(0)

function onHeroMove(e: MouseEvent) {
  const r = visual.value!.getBoundingClientRect()
  hx.value = (e.clientX - r.left) / r.width - 0.5
  hy.value = (e.clientY - r.top) / r.height - 0.5
}

function resetHero() {
  hx.value = 0
  hy.value = 0
}

// depth 越大平移幅度越大（近景），形成分层视差
function layer(depth: number) {
  return `translate3d(${(hx.value * depth * 14).toFixed(1)}px, ${(hy.value * depth * 14).toFixed(1)}px, 0)`
}

// ===== 站点设置 store =====
const settings = useSettingsStore()

// ===== 管理员判断 =====
const isAdmin = !!(localStorage.getItem('blog_token') && localStorage.getItem('blog_admin'))

// ===== 文章列表数据 =====
const articles = ref<Article[]>([])
const total = ref(0)
const page = ref(1)
const size = 9
const loading = ref(true)

const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])
const activeCategory = ref<number | null>(null)
const activeTag = ref<number | null>(null)

const listRef = ref<HTMLElement>()

async function load() {
  loading.value = true
  try {
    const res = await fetchArticles({
      page: page.value,
      size,
      categoryId: activeCategory.value,
      tagId: activeTag.value
    })
    articles.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// 筛选切换：再次点击同一项即取消筛选
function toggleCategory(id: number | null) {
  activeCategory.value = id === null ? null : activeCategory.value === id ? null : id
  page.value = 1
  load()
}

function toggleTag(id: number) {
  activeTag.value = activeTag.value === id ? null : id
  page.value = 1
  load()
}

function scrollToList() {
  listRef.value?.scrollIntoView({ behavior: 'smooth' })
}

watch(page, load)

onMounted(async () => {
  load()
  settings.load()
  try {
    const [cs, ts] = await Promise.all([fetchCategories(), fetchTags()])
    categories.value = cs
    tags.value = ts
  } catch {
    // 分类/标签加载失败不影响文章列表展示
  }
})
</script>

<template>
  <section class="flex flex-col gap-16 md:gap-24">
    <!-- ================= Hero：左文案 + 右动漫视差视觉 ================= -->
    <div class="grid items-center gap-12 py-6 md:py-12 lg:grid-cols-[1.05fr_1fr]">
      <!-- 文案区：子元素错峰入场 -->
      <div class="relative z-10 flex flex-col items-start gap-6">
        <div class="flex animate-fade-up items-center gap-3">
          <span class="cyber-line w-10" />
          <p class="text-xs tracking-[0.4em] text-sakura">赛博星轨 · 数字日记</p>
        </div>

        <h1 class="animate-fade-up font-display text-5xl leading-tight md:text-6xl" style="animation-delay: 60ms">
          <span class="glow-text">{{ settings.siteName }}</span>
        </h1>
        <p class="animate-fade-up font-display text-xl tracking-[0.25em] text-primary/90" style="animation-delay: 120ms">
          NEON LOG <span class="text-sm font-normal tracking-normal text-muted-foreground">/ 个人技术博客</span>
        </p>

        <p class="max-w-md animate-fade-up text-sm leading-loose text-muted-foreground" style="animation-delay: 180ms">
          {{ settings.siteDesc }}
        </p>

        <div class="mt-2 flex animate-fade-up flex-wrap items-center gap-3" style="animation-delay: 240ms">
          <Button size="lg" @click="scrollToList">开始阅读<ArrowDown /></Button>
          <RouterLink v-if="isAdmin" to="/admin">
            <Button variant="outline" size="lg">控制台</Button>
          </RouterLink>
        </div>

        <div class="mt-2 flex animate-fade-up flex-wrap gap-2" style="animation-delay: 300ms">
          <span class="chip"># Vue3</span>
          <span class="chip"># TypeScript</span>
          <span class="chip"># 二次元</span>
        </div>
      </div>

      <!-- 视觉区：看板娘插画 + 视差浮层 -->
      <div
        ref="visual"
        class="relative mx-auto w-full max-w-sm animate-fade-up lg:max-w-none"
        @mousemove="onHeroMove"
        @mouseleave="resetHero"
      >
        <div
          class="relative overflow-hidden rounded-[2rem] border border-primary/25 shadow-[0_0_50px_hsl(var(--primary)/0.25)] transition-transform duration-300 ease-out"
          :style="{ transform: layer(0.5) }"
        >
          <img :src="settings.heroImage" alt="赛博抽象视觉" class="aspect-[3/4] w-full object-cover" loading="eager" />
          <div class="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
        </div>

        <!-- 浮动徽章（不同深度视差层） -->
        <div class="float-badge -left-4 top-10" :style="{ transform: layer(1.3) }">
          <Sparkles class="h-3.5 w-3.5 text-sakura" /> 星尘流萤
        </div>
        <div class="float-badge -right-3 bottom-20" :style="{ transform: layer(1.7) }">
          <Zap class="h-3.5 w-3.5 text-primary" /> CYBER MODE
        </div>

        <!-- 竖排装饰文字 -->
        <span class="jp-vertical absolute -right-7 top-1/2 hidden -translate-y-1/2 text-xs text-primary/50 md:block">
          在星光与代码之间
        </span>
      </div>
    </div>

    <!-- 向下滚动提示 -->
    <div class="-mt-8 flex justify-center md:-mt-12">
      <div class="flex flex-col items-center gap-2 text-muted-foreground">
        <span class="text-[10px] tracking-[0.4em]">SCROLL</span>
        <ChevronDown class="h-4 w-4 animate-bounce text-primary" />
      </div>
    </div>

    <!-- ================= 文章列表 ================= -->
    <div ref="listRef" class="flex scroll-mt-24 flex-col gap-10">
      <!-- 区块标题 -->
      <div class="flex flex-col items-center gap-4">
        <p class="text-xs tracking-[0.5em] text-sakura">LATEST</p>
        <h2 class="font-display text-3xl tracking-wide">最新文章</h2>
        <div class="cyber-line w-48" />
      </div>

      <!-- 筛选：分类 + 标签 -->
      <div class="flex flex-col items-center gap-4">
        <div class="flex flex-wrap justify-center gap-2">
          <button class="chip" :class="{ active: activeCategory === null }" @click="toggleCategory(null)">全部</button>
          <button
            v-for="c in categories"
            :key="c.id"
            class="chip"
            :class="{ active: activeCategory === c.id }"
            @click="toggleCategory(c.id)"
          >
            {{ c.name }}
          </button>
        </div>
        <div v-if="tags.length" class="flex flex-wrap justify-center gap-2">
          <button
            v-for="t in tags"
            :key="t.id"
            class="chip"
            :class="{ active: activeTag === t.id }"
            @click="toggleTag(t.id)"
          >
            # {{ t.name }}
          </button>
        </div>
      </div>

      <!-- 加载骨架屏 / 卡片网格 / 空状态 -->
      <div v-if="loading" class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 6" :key="i" class="flex flex-col gap-3">
          <Skeleton class="aspect-[16/9] w-full" />
          <Skeleton class="h-5 w-3/4" />
          <Skeleton class="h-4 w-full" />
        </div>
      </div>
      <template v-else>
        <div v-if="articles.length" class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <ArticleCard v-for="a in articles" :key="a.id" :article="a" />
        </div>
        <div v-else class="flex flex-col items-center gap-3 py-24 text-muted-foreground">
          <p class="font-display text-lg tracking-widest">NO SIGNAL</p>
          <p class="text-xs tracking-widest">暂无文章 · 信号静默中</p>
        </div>
        <Pagination v-if="total > size" :page="page" :size="size" :total="total" @update:page="page = $event" />
      </template>
    </div>
  </section>
</template>

<style scoped>
/* 插画上的浮动徽章：磨砂 + 柔光，跟随视差平滑移动 */
.float-badge {
  @apply absolute flex items-center gap-1.5 rounded-full border border-primary/30 bg-card/80 px-3 py-1.5 text-xs backdrop-blur transition-transform duration-300 ease-out;
  box-shadow: 0 0 16px hsl(var(--primary) / 0.25);
}
</style>
