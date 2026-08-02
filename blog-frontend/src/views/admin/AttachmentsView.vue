<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Copy, Trash2, Upload } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { deleteAttachment, fetchAttachments, uploadAttachment, type Attachment } from '@/api'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Pagination from '@/components/Pagination.vue'

// 附件管理：上传图片 / 复制链接 / 删除
const list = ref<Attachment[]>([])
const total = ref(0)
const page = ref(1)
const size = 12
const loading = ref(true)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement>()

async function load() {
  loading.value = true
  try {
    const res = await fetchAttachments({ page: page.value, size })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// 选择文件后立即上传
async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    await uploadAttachment(file)
    toast.success('上传成功')
    page.value = 1
    load()
  } catch {
    // 错误提示已由 axios 拦截器统一处理
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = '' // 允许重复选择同一文件
  }
}

// 复制完整访问链接
async function copyUrl(a: Attachment) {
  try {
    await navigator.clipboard.writeText(`${location.origin}${a.url}`)
    toast.success('链接已复制')
  } catch {
    toast.error('复制失败，请手动复制')
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// 删除确认
const deleteTarget = ref<Attachment | null>(null)
const dialogOpen = ref(false)
const deleting = ref(false)

function confirmDelete(a: Attachment) {
  deleteTarget.value = a
  dialogOpen.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteAttachment(deleteTarget.value.id)
    toast.success('删除成功')
    dialogOpen.value = false
    load()
  } finally {
    deleting.value = false
  }
}

watch(page, load)
onMounted(load)
</script>

<template>
  <section class="flex flex-col gap-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-2xl tracking-wide">附件管理</h1>
        <p class="mt-1 text-xs text-muted-foreground">共 {{ total }} 个文件 · 支持 png/jpg/gif/webp/svg，单文件 ≤ 5MB</p>
      </div>
      <Button size="sm" :disabled="uploading" @click="fileInput?.click()">
        <Upload class="h-4 w-4" />{{ uploading ? '上传中…' : '上传图片' }}
      </Button>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
    </div>

    <div v-if="loading" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <Skeleton v-for="i in 8" :key="i" class="aspect-[16/10] w-full" />
    </div>

    <div v-else-if="list.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="a in list" :key="a.id" class="neon-card group overflow-hidden !p-0">
        <div class="aspect-[16/10] w-full overflow-hidden bg-muted/30">
          <img
            :src="a.url"
            :alt="a.original_name"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div class="flex items-center gap-2 p-3">
          <div class="flex min-w-0 flex-1 flex-col">
            <span class="truncate text-xs" :title="a.original_name">{{ a.original_name }}</span>
            <span class="text-[10px] text-muted-foreground">{{ formatSize(a.size) }}</span>
          </div>
          <Button variant="ghost" size="icon" class="h-8 w-8" aria-label="复制链接" @click="copyUrl(a)">
            <Copy class="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-destructive hover:text-destructive"
            aria-label="删除"
            @click="confirmDelete(a)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>

    <div v-else class="py-24 text-center text-sm text-muted-foreground">暂无附件，点击右上角「上传图片」</div>

    <Pagination v-if="total > size" :page="page" :size="size" :total="total" @update:page="page = $event" />

    <!-- 删除确认弹窗 -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">
          确定删除附件「{{ deleteTarget?.original_name }}」吗？文件将从服务器移除，引用它的文章图片会失效。
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
