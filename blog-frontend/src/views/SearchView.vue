<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { SearchX } from 'lucide-vue-next'
import { fetchArticles } from '@/api'
import type { Article } from '@/types'
import ArticleCard from '@/components/ArticleCard.vue'
import Pagination from '@/components/Pagination.vue'
import { Skeleton } from '@/components/ui/skeleton'

// 搜索结果页：从路由 query.q 读取关键词，支持分页
const route = useRoute()

const articles = ref<Article[]>([])
const total = ref(0)
const page = ref(1)
const size = 9
const loading = ref(true)

const keyword = computed(() => String(route.query.q || '').trim())

async function load() {
  if (!keyword.value) {
    articles.value = []
    total.value = 0
    loading.value = false
    return
  }
  loading.value = true
  try {
    const res = await fetchArticles({ page: page.value, size, keyword: keyword.value })
    articles.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// 关键词变化时重置分页重新搜索
watch(keyword, () => {
  page.value = 1
  load()
})
watch(page, load)
onMounted(load)
</script>

<template>
  <section class="flex flex-col gap-12 md:gap-16">
    <!-- 页头 -->
    <header class="flex animate-fade-up flex-col items-center gap-4 text-center">
      <p class="text-xs tracking-[0.5em] text-sakura">SEARCH</p>
      <h1 class="glow-text font-display text-4xl tracking-wide md:text-5xl">搜索结果</h1>
      <p v-if="keyword" class="text-sm text-muted-foreground">
        关键词「<span class="text-primary">{{ keyword }}</span>」 · 共 {{ total }} 篇
      </p>
      <div class="cyber-line w-48" />
    </header>

    <!-- 结果列表 -->
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
      <div v-else class="flex flex-col items-center gap-3 py-24 text-muted-foreground">
        <SearchX class="h-8 w-8 text-primary/50" />
        <p class="font-display text-lg tracking-widest">NO SIGNAL</p>
        <p class="text-xs tracking-widest">
          {{ keyword ? '没有找到相关文章，换个关键词试试' : '请输入关键词进行搜索' }}
        </p>
      </div>
      <Pagination v-if="total > size" :page="page" :size="size" :total="total" @update:page="page = $event" />
    </template>
  </section>
</template>
