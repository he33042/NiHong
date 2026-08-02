<script setup lang="ts">
import dayjs from 'dayjs'
import { CalendarDays, Folder } from 'lucide-vue-next'
import { Card } from '@/components/ui/card'
import TiltCard from '@/components/TiltCard.vue'
import type { Article } from '@/types'

// 文章卡片：3D 倾斜 + 封面 + 标题 + 简介 + 元信息（日期/分类/标签）
defineProps<{ article: Article }>()
</script>

<template>
  <RouterLink :to="`/article/${article.id}`" class="block h-full">
    <TiltCard>
      <Card class="group h-full overflow-hidden">
        <!-- 封面 + 标题覆盖 -->
        <div class="relative aspect-[16/9] w-full overflow-hidden">
          <img
            v-if="article.cover"
            :src="article.cover"
            :alt="article.title"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div
            v-else
            class="h-full w-full bg-gradient-to-br from-primary/20 via-background to-secondary/10"
          />
          <!-- 标题覆盖层 -->
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-3 pt-10">
            <h3 class="line-clamp-1 font-display text-lg tracking-wide text-white">
              {{ article.title }}
            </h3>
          </div>
        </div>
        <!-- 底部信息 -->
        <div class="flex flex-col gap-2.5 p-5">
          <p class="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {{ article.summary || '暂无简介' }}
          </p>
          <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span class="inline-flex items-center gap-1">
              <CalendarDays class="h-3.5 w-3.5" />{{ dayjs(article.created_at).format('YYYY-MM-DD') }}
            </span>
            <span v-if="article.category_name" class="inline-flex items-center gap-1 text-primary/80">
              <Folder class="h-3.5 w-3.5" />{{ article.category_name }}
            </span>
            <span v-for="t in article.tags" :key="t.id" class="chip !px-2 !py-0.5"># {{ t.name }}</span>
          </div>
        </div>
      </Card>
    </TiltCard>
  </RouterLink>
</template>
