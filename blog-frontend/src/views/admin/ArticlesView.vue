<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { adminFetchArticles, deleteArticle, updateArticleStatus } from '@/api'
import type { Article } from '@/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Pagination from '@/components/Pagination.vue'

const router = useRouter()

const list = ref<Article[]>([])
const total = ref(0)
const page = ref(1)
const size = 10
const loading = ref(true)
const statusFilter = ref<number | null>(null)

const statusOptions = [
  { label: '全部状态', value: null },
  { label: '已发布', value: 1 },
  { label: '草稿', value: 0 }
]

async function load() {
  loading.value = true
  try {
    const res = await adminFetchArticles({ page: page.value, size, status: statusFilter.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// 状态快捷切换：草稿 <-> 已发布（乐观更新）
const togglingId = ref<number | null>(null)
async function toggleStatus(a: Article) {
  if (togglingId.value !== null) return
  togglingId.value = a.id
  const next = a.status === 1 ? 0 : 1
  try {
    await updateArticleStatus(a.id, next)
    a.status = next as 0 | 1
    toast.success(next === 1 ? '已发布' : '已转为草稿')
  } finally {
    togglingId.value = null
  }
}

// 删除确认
const deleteTarget = ref<Article | null>(null)
const dialogOpen = ref(false)
const deleting = ref(false)

function confirmDelete(a: Article) {
  deleteTarget.value = a
  dialogOpen.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteArticle(deleteTarget.value.id)
    toast.success('删除成功')
    dialogOpen.value = false
    load()
  } finally {
    deleting.value = false
  }
}

watch(statusFilter, () => {
  page.value = 1
  load()
})
watch(page, load)
onMounted(load)
</script>

<template>
  <section class="flex flex-col gap-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl tracking-wide">文章管理</h1>
        <p class="mt-1 text-xs text-muted-foreground">共 {{ total }} 篇</p>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="statusFilter"
          class="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option v-for="o in statusOptions" :key="o.label" :value="o.value">{{ o.label }}</option>
        </select>
        <Button size="sm" @click="router.push('/admin/articles/new')">
          <Plus class="h-4 w-4" />新建文章
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex flex-col gap-3">
      <Skeleton v-for="i in 5" :key="i" class="h-14 w-full" />
    </div>

    <!-- 微光边框表格 -->
    <div v-else-if="list.length" class="neon-card overflow-x-auto !p-0">
      <table class="w-full min-w-[680px] text-sm">
        <thead>
          <tr class="border-b border-primary/15 text-left text-xs text-muted-foreground">
            <th class="th">封面</th>
            <th class="th">标题</th>
            <th class="th">分类</th>
            <th class="th">状态</th>
            <th class="th">更新时间</th>
            <th class="th text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="a in list"
            :key="a.id"
            class="border-b border-primary/10 transition-colors last:border-0 hover:bg-primary/5"
          >
            <td class="td">
              <img v-if="a.cover" :src="a.cover" class="h-10 w-16 rounded-md object-cover" loading="lazy" />
              <span v-else class="text-xs text-muted-foreground">无</span>
            </td>
            <td class="td max-w-[220px]">
              <span class="block truncate font-medium" :title="a.title">{{ a.title }}</span>
            </td>
            <td class="td text-muted-foreground">{{ a.category_name || '未分类' }}</td>
            <td class="td">
              <!-- 状态切换按钮：点击即切换草稿/已发布 -->
              <button
                class="status-toggle"
                :class="{ on: a.status === 1 }"
                :disabled="togglingId === a.id"
                @click="toggleStatus(a)"
              >
                <span class="dot" />
                {{ a.status === 1 ? '已发布' : '草稿' }}
              </button>
            </td>
            <td class="td text-muted-foreground">{{ dayjs(a.updated_at).format('YYYY-MM-DD HH:mm') }}</td>
            <td class="td">
              <div class="flex justify-end gap-1">
                <Button variant="ghost" size="icon" aria-label="编辑" @click="router.push(`/admin/articles/${a.id}/edit`)">
                  <Pencil class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="text-destructive hover:text-destructive"
                  aria-label="删除"
                  @click="confirmDelete(a)"
                >
                  <Trash2 class="h-4 w-4" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="py-24 text-center text-sm text-muted-foreground">
      暂无文章，点击右上角「新建文章」开始创作
    </div>

    <Pagination v-if="total > size" :page="page" :size="size" :total="total" @update:page="page = $event" />

    <!-- 删除确认弹窗 -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">
          删除后不可恢复，确定删除文章「{{ deleteTarget?.title }}」吗？
        </p>
        <DialogFooter>
          <Button variant="ghost" @click="dialogOpen = false">取消</Button>
          <Button variant="destructive" :disabled="deleting" @click="doDelete">
            {{ deleting ? '删除中…' : '确认删除' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>

<style scoped>
.th {
  @apply px-4 py-3 font-normal tracking-widest;
}
.td {
  @apply px-4 py-3 align-middle;
}

/* 状态切换按钮：草稿=紫，已发布=青（带呼吸光点） */
.status-toggle {
  @apply inline-flex items-center gap-1.5 rounded-full border border-secondary/40 bg-secondary/10 px-2.5 py-0.5 text-xs text-secondary transition-all duration-300 hover:shadow-[0_0_12px_hsl(var(--secondary)/0.4)] disabled:opacity-50;
}
.status-toggle.on {
  @apply border-primary/50 bg-primary/10 text-primary hover:shadow-[0_0_12px_hsl(var(--primary)/0.5)];
}
.status-toggle .dot {
  @apply h-1.5 w-1.5 rounded-full bg-secondary;
}
.status-toggle.on .dot {
  @apply bg-primary;
  box-shadow: 0 0 6px hsl(var(--primary) / 0.9);
}
</style>
