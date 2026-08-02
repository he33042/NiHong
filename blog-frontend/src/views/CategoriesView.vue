<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Folder, LayoutGrid } from 'lucide-vue-next'
import { fetchArticles, fetchCategories } from '@/api'
import type { Article, Category } from '@/types'
import ArticleCard from '@/components/ArticleCard.vue'
import Pagination from '@/components/Pagination.vue'
import { Skeleton } from '@/components/ui/skeleton'

// 分类页：展示所有分类卡片，点击筛选对应文章（null = 全部）
const categories = ref<Category[]>([])
const catsLoading = ref(true)
const activeId = ref<number | null>(null)

const articles = ref<Article[]>([])
const total = ref(0)
const page = ref(1)
const size = 9
const loading = ref(true)

const activeName = computed(() =>
  activeId.value === null ? '全部文章' : categories.value.find((c) => c.id === activeId.value)?.name || ''
)

async function load() {
  loading.value = true
  try {
    const res = await fetchArticles({ page: page.value, size, categoryId: activeId.value })
    articles.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function select(id: number | null) {
  if (activeId.value === id) return
  activeId.value = id
  page.value = 1
  load()
}

watch(page, load)

onMounted(async () => {
  load()
  try {
    categories.value = await fetchCategories()
  } finally {
    catsLoading.value = false
  }
})
</script>

<template>
  <section class="flex flex-col gap-14 md:gap-20">
    <!-- 页头 -->
    <header class="flex animate-fade-up flex-col items-center gap-4 text-center">
      <p class="text-xs tracking-[0.5em] text-sakura">CATEGORIES</p>
      <h1 class="glow-text font-display text-4xl tracking-wide md:text-5xl">文章分类</h1>
      <p class="max-w-md text-sm leading-relaxed text-muted-foreground">
        按主题浏览全部文章，找到你感兴趣的领域。
      </p>
      <div class="cyber-line w-48" />
    </header>

    <!-- 分类卡片网格 -->
    <div v-if="catsLoading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton v-for="i in 6" :key="i" class="h-[4.5rem] w-full" />
    </div>
    <div v-else class="grid animate-fade-up gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <button class="cat-card" :class="{ active: activeId === null }" @click="select(null)">
        <LayoutGrid class="h-5 w-5 shrink-0 text-primary" />
        <span class="font-display text-lg tracking-wide">全部文章</span>
        <span class="ghost-num">00</span>
      </button>
      <button
        v-for="(c, i) in categories"
        :key="c.id"
        class="cat-card"
        :class="{ active: activeId === c.id }"
        @click="select(c.id)"
      >
        <Folder class="h-5 w-5 shrink-0 text-primary" />
        <span class="font-display text-lg tracking-wide">{{ c.name }}</span>
        <span class="ghost-num">{{ String(i + 1).padStart(2, '0') }}</span>
      </button>
    </div>

    <!-- 筛选结果 -->
    <div class="flex flex-col gap-8">
      <div class="flex items-center gap-4">
        <span class="cyber-line flex-1" />
        <p class="shrink-0 text-xs tracking-widest text-muted-foreground">{{ activeName }} · {{ total }} 篇</p>
        <span class="cyber-line flex-1" />
      </div>

      <div v-if="loading" class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="flex flex-col gap-3">
          <Skeleton class="aspect-[16/9] w-full" />
          <Skeleton class="h-5 w-3/4" />
          <Skeleton class="h-4 w-full" />
        </div>
      </div>
      <template v-else>
        <div v-if="articles.length" class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <ArticleCard v-for="a in articles" :key="a.id" :article="a" />
        </div>
        <div v-else class="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <p class="font-display text-lg tracking-widest">NO SIGNAL</p>
          <p class="text-xs tracking-widest">该分类下暂无文章</p>
        </div>
        <Pagination v-if="total > size" :page="page" :size="size" :total="total" @update:page="page = $event" />
      </template>
    </div>
  </section>
</template>

<style scoped>
/* 分类卡片：hover 微光上浮，选中时樱粉描边光晕 */
.cat-card {
  @apply relative flex items-center gap-3 overflow-hidden rounded-xl border border-primary/15 bg-card/60 p-5 text-left backdrop-blur-sm transition-all duration-300;
}
.cat-card:hover {
  @apply -translate-y-0.5 border-primary/45;
  box-shadow:
    0 0 20px hsl(var(--primary) / 0.18),
    0 0 40px hsl(var(--secondary) / 0.1);
}
.cat-card.active {
  @apply border-sakura/60 bg-sakura/5;
  box-shadow: 0 0 24px hsl(var(--sakura) / 0.3);
}
/* 背景幽灵序号装饰 */
.ghost-num {
  @apply absolute right-4 top-1/2 -translate-y-1/2 font-display text-4xl text-primary/10 transition-colors duration-300;
}
.cat-card:hover .ghost-num {
  @apply text-primary/25;
}
.cat-card.active .ghost-num {
  @apply text-sakura/25;
}
</style>
