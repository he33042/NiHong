<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Hash } from 'lucide-vue-next'
import { fetchArticles, fetchTags } from '@/api'
import type { Article, Tag } from '@/types'
import ArticleCard from '@/components/ArticleCard.vue'
import Pagination from '@/components/Pagination.vue'
import { Skeleton } from '@/components/ui/skeleton'

// 标签聚合页：彩色标签云，点击筛选对应文章（null = 全部）
const tags = ref<Tag[]>([])
const tagsLoading = ref(true)
const activeId = ref<number | null>(null)

const articles = ref<Article[]>([])
const total = ref(0)
const page = ref(1)
const size = 9
const loading = ref(true)

const activeName = computed(() =>
  activeId.value === null ? '全部文章' : `# ${tags.value.find((t) => t.id === activeId.value)?.name || ''}`
)

// 标签云：按 id 确定性分配字号与颜色，避免刷新闪烁
const SIZES = ['text-xs px-3 py-1', 'text-sm px-3.5 py-1.5', 'text-base px-4 py-2', 'text-lg px-5 py-2']
const COLORS = ['c-cyan', 'c-pink', 'c-purple']
const sizeClass = (id: number) => SIZES[id % SIZES.length]
const colorClass = (id: number) => COLORS[id % COLORS.length]

async function load() {
  loading.value = true
  try {
    const res = await fetchArticles({ page: page.value, size, tagId: activeId.value })
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
    tags.value = await fetchTags()
  } finally {
    tagsLoading.value = false
  }
})
</script>

<template>
  <section class="flex flex-col gap-14 md:gap-20">
    <!-- 页头 -->
    <header class="flex animate-fade-up flex-col items-center gap-4 text-center">
      <p class="text-xs tracking-[0.5em] text-sakura">TAGS</p>
      <h1 class="glow-text font-display text-4xl tracking-wide md:text-5xl">标签云</h1>
      <p class="max-w-md text-sm leading-relaxed text-muted-foreground">
        散落的关键词星云，点击任意标签聚合相关文章。
      </p>
      <div class="cyber-line w-48" />
    </header>

    <!-- 标签云 -->
    <div v-if="tagsLoading" class="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
      <Skeleton v-for="i in 10" :key="i" class="h-8 w-20 rounded-full" />
    </div>
    <div v-else-if="tags.length" class="mx-auto flex max-w-3xl animate-fade-up flex-wrap items-center justify-center gap-3">
      <button class="tag-item c-all text-sm px-4 py-1.5" :class="{ active: activeId === null }" @click="select(null)">
        全部
      </button>
      <button
        v-for="t in tags"
        :key="t.id"
        class="tag-item"
        :class="[sizeClass(t.id), colorClass(t.id), { active: activeId === t.id }]"
        @click="select(t.id)"
      >
        <Hash class="mr-0.5 h-3 w-3 opacity-60" />{{ t.name }}
      </button>
    </div>
    <div v-else class="py-10 text-center text-xs tracking-widest text-muted-foreground">暂无标签</div>

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
          <p class="text-xs tracking-widest">该标签下暂无文章</p>
        </div>
        <Pagination v-if="total > size" :page="page" :size="size" :total="total" @update:page="page = $event" />
      </template>
    </div>
  </section>
</template>

<style scoped>
/* 标签云基底：hover 上浮 + 微光 */
.tag-item {
  @apply inline-flex cursor-pointer select-none items-center rounded-full border bg-card/50 backdrop-blur-sm transition-all duration-300;
}
.tag-item:hover {
  transform: translateY(-2px);
}

/* 三色循环：青 / 粉 / 紫 */
.c-cyan {
  @apply border-primary/30 text-primary/90;
}
.c-cyan:hover,
.c-cyan.active {
  @apply border-primary/70 bg-primary/10;
  box-shadow: 0 0 14px hsl(var(--primary) / 0.4);
}
.c-pink {
  @apply border-sakura/30 text-sakura;
}
.c-pink:hover,
.c-pink.active {
  @apply border-sakura/70 bg-sakura/10;
  box-shadow: 0 0 14px hsl(var(--sakura) / 0.4);
}
.c-purple {
  @apply border-secondary/40 text-secondary;
}
.c-purple:hover,
.c-purple.active {
  @apply border-secondary/70 bg-secondary/10;
  box-shadow: 0 0 14px hsl(var(--secondary) / 0.4);
}
/* 「全部」：中性描边 */
.c-all {
  @apply border-border text-muted-foreground;
}
.c-all:hover,
.c-all.active {
  @apply border-primary/60 bg-primary/10 text-primary;
  box-shadow: 0 0 14px hsl(var(--primary) / 0.35);
}
</style>
