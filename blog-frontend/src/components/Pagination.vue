<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

// 轻量分页组件：页码窗口 + 省略号
const props = defineProps<{ page: number; total: number; size: number }>()
const emit = defineEmits<{ 'update:page': [number] }>()

const pages = computed(() => Math.max(1, Math.ceil(props.total / props.size)))

// 页码窗口：总页数 <= 7 全部展示，否则 当前页±1 + 首尾 + 省略号
const items = computed<Array<number | string>>(() => {
  const n = pages.value
  const p = props.page
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1)
  const nums: Array<number | string> = [1]
  if (p > 3) nums.push('…')
  for (let i = Math.max(2, p - 1); i <= Math.min(n - 1, p + 1); i++) nums.push(i)
  if (p < n - 2) nums.push('…')
  nums.push(n)
  return nums
})

function go(n: number) {
  if (n >= 1 && n <= pages.value && n !== props.page) emit('update:page', n)
}
</script>

<template>
  <nav class="flex items-center justify-center gap-2" aria-label="分页">
    <button class="page-btn" :disabled="page <= 1" aria-label="上一页" @click="go(page - 1)">
      <ChevronLeft class="h-4 w-4" />
    </button>
    <template v-for="(it, i) in items" :key="i">
      <span v-if="it === '…'" class="px-1 text-muted-foreground">…</span>
      <button v-else class="page-btn" :class="{ active: it === page }" @click="go(it as number)">
        {{ it }}
      </button>
    </template>
    <button class="page-btn" :disabled="page >= pages" aria-label="下一页" @click="go(page + 1)">
      <ChevronRight class="h-4 w-4" />
    </button>
  </nav>
</template>

<style scoped>
.page-btn {
  @apply flex h-8 min-w-8 items-center justify-center rounded-md border border-primary/20 px-2 text-xs text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:text-primary disabled:pointer-events-none disabled:opacity-40;
}
.page-btn.active {
  @apply border-primary/60 bg-primary/10 text-primary;
  box-shadow: 0 0 10px hsl(var(--primary) / 0.35);
}
</style>
