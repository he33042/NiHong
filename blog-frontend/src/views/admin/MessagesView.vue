<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { CornerDownRight, Globe, Mail, MessageSquareReply, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { deleteMessage, fetchMessages, replyMessage } from '@/api'
import type { Message } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Pagination from '@/components/Pagination.vue'
import { nameColor } from '@/lib/utils'

// 留言管理：查看全部留言 + 删除 + 回复 + 联系方式（需登录）
const list = ref<Message[]>([])
const total = ref(0)
const page = ref(1)
const size = 10
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const res = await fetchMessages({ page: page.value, size })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// 删除确认
const deleteTarget = ref<Message | null>(null)
const dialogOpen = ref(false)
const deleting = ref(false)

function confirmDelete(m: Message) {
  deleteTarget.value = m
  dialogOpen.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await deleteMessage(deleteTarget.value.id)
    toast.success('删除成功')
    dialogOpen.value = false
    load()
  } finally {
    deleting.value = false
  }
}

// 回复功能
const replyTarget = ref<number | null>(null)
const replyForm = reactive({ nickname: '博主', content: '' })
const replying = ref(false)

function toggleReply(msgId: number) {
  replyTarget.value = replyTarget.value === msgId ? null : msgId
  replyForm.content = ''
}

async function doReply(msgId: number) {
  if (!replyForm.content.trim()) {
    toast.error('请输入回复内容')
    return
  }
  replying.value = true
  try {
    await replyMessage(msgId, { nickname: replyForm.nickname.trim() || '博主', content: replyForm.content.trim() })
    toast.success('回复成功')
    replyTarget.value = null
    replyForm.content = ''
    load()
  } catch {
    // 统一错误处理
  } finally {
    replying.value = false
  }
}

watch(page, load)
onMounted(load)
</script>

<template>
  <section class="flex flex-col gap-8">
    <div>
      <h1 class="font-display text-2xl tracking-wide">留言管理</h1>
      <p class="mt-1 text-xs text-muted-foreground">共 {{ total }} 条访客留言</p>
    </div>

    <div v-if="loading" class="flex flex-col gap-3">
      <Skeleton v-for="i in 5" :key="i" class="h-16 w-full" />
    </div>

    <div v-else-if="list.length" class="flex flex-col gap-3">
      <template v-for="m in list" :key="m.id">
        <!-- 父留言 -->
        <div class="neon-card flex items-start gap-4 p-4">
          <span
            class="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-lg border font-display"
            :class="nameColor(m.nickname)"
          >
            {{ m.nickname.charAt(0) }}
          </span>
          <div class="flex min-w-0 flex-1 flex-col gap-1">
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span class="text-sm font-medium">{{ m.nickname }}</span>
              <span class="text-xs text-muted-foreground">{{ dayjs(m.created_at).format('YYYY-MM-DD HH:mm') }}</span>
            </div>
            <p class="whitespace-pre-wrap break-words text-sm text-muted-foreground">{{ m.content }}</p>
            <!-- 联系方式 -->
            <div v-if="m.email || m.website" class="mt-1 flex flex-wrap gap-3">
              <a
                v-if="m.email"
                :href="`mailto:${m.email}`"
                class="inline-flex items-center gap-1 text-xs text-primary/70 transition-colors hover:text-primary"
              >
                <Mail class="h-3 w-3" /> {{ m.email }}
              </a>
              <a
                v-if="m.website"
                :href="m.website.startsWith('http') ? m.website : `https://${m.website}`"
                target="_blank"
                class="inline-flex items-center gap-1 text-xs text-primary/70 transition-colors hover:text-primary"
              >
                <Globe class="h-3 w-3" /> {{ m.website }}
              </a>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-0.5">
            <Button variant="ghost" size="icon" aria-label="回复" @click="toggleReply(m.id)">
              <MessageSquareReply class="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="text-destructive hover:text-destructive"
              aria-label="删除"
              @click="confirmDelete(m)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- 回复表单 -->
        <div v-if="replyTarget === m.id" class="neon-card ml-10 flex flex-col gap-3 p-4">
          <div class="flex items-center gap-2 text-xs text-muted-foreground">
            <CornerDownRight class="h-3.5 w-3.5" />
            回复 @{{ m.nickname }}
          </div>
          <Textarea v-model="replyForm.content" placeholder="输入回复内容…" :rows="3" maxlength="500" />
          <div class="flex justify-end gap-2">
            <Button variant="ghost" size="sm" @click="toggleReply(m.id)">取消</Button>
            <Button size="sm" :disabled="replying" @click="doReply(m.id)">
              {{ replying ? '发送中…' : '发送回复' }}
            </Button>
          </div>
        </div>

        <!-- 子回复列表 -->
        <div v-if="m.replies?.length" class="ml-10 flex flex-col gap-2 border-l-2 border-primary/15 pl-4">
          <div v-for="r in m.replies" :key="r.id" class="neon-card flex items-start gap-3 p-3">
            <span
              class="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-lg border text-xs font-display"
              :class="nameColor(r.nickname)"
            >
              {{ r.nickname.charAt(0) }}
            </span>
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span class="text-xs font-medium">{{ r.nickname }}</span>
                <span class="text-[10px] text-muted-foreground">{{ dayjs(r.created_at).format('YYYY-MM-DD HH:mm') }}</span>
              </div>
              <p class="whitespace-pre-wrap break-words text-xs text-muted-foreground">{{ r.content }}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="shrink-0 text-destructive hover:text-destructive"
              aria-label="删除"
              @click="confirmDelete(r)"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </template>
      <Pagination v-if="total > size" :page="page" :size="size" :total="total" @update:page="page = $event" />
    </div>

    <div v-else class="py-24 text-center text-sm text-muted-foreground">暂无留言</div>

    <!-- 删除确认弹窗 -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">
          确定删除「{{ deleteTarget?.nickname }}」的这条留言吗？此操作不可恢复。
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
