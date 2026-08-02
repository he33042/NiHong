<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { LogIn, MessageCircle, Send } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { createMessage, fetchMessages } from '@/api'
import type { Message } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import Pagination from '@/components/Pagination.vue'
import { nameColor } from '@/lib/utils'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 留言板：需登录后才能留言
const content = ref('')
const email = ref('')
const website = ref('')
const sending = ref(false)

const messages = ref<Message[]>([])
const total = ref(0)
const page = ref(1)
const size = 10
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const res = await fetchMessages({ page: page.value, size })
    messages.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function submit() {
  const text = content.value.trim()
  if (!text) {
    toast.error('请填写留言内容')
    return
  }
  if (text.length > 500) {
    toast.error('留言不能超过 500 字')
    return
  }
  sending.value = true
  try {
    await createMessage({ content: text, email: email.value.trim(), website: website.value.trim() })
    toast.success('留言成功，感谢你的到访')
    content.value = ''
    page.value = 1
    load()
  } catch {
    // 错误提示已由 axios 拦截器统一处理
  } finally {
    sending.value = false
  }
}

watch(page, load)
onMounted(load)
</script>

<template>
  <section class="mx-auto flex max-w-3xl flex-col gap-14 md:gap-16">
    <!-- 页头 -->
    <header class="flex animate-fade-up flex-col items-center gap-4 text-center">
      <p class="text-xs tracking-[0.5em] text-sakura">GUESTBOOK</p>
      <h1 class="glow-text font-display text-4xl tracking-wide md:text-5xl">留言板</h1>
      <p class="max-w-md text-sm leading-relaxed text-muted-foreground">
        路过的朋友，留下你的足迹吧——建议、想法或者只是打个招呼都好。
      </p>
      <div class="cyber-line w-48" />
    </header>

    <!-- 留言表单 -->
    <div v-if="userStore.isLoggedIn" class="neon-card relative animate-fade-up flex flex-col gap-4 p-6 md:p-8" style="animation-delay: 80ms">
      <span class="cyber-corner left-0 top-0 border-l border-t" />
      <span class="cyber-corner right-0 top-0 border-r border-t" />
      <span class="cyber-corner bottom-0 left-0 border-b border-l" />
      <span class="cyber-corner bottom-0 right-0 border-b border-r" />

      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <MessageCircle class="h-4 w-4 text-primary" />
        以 <span class="font-medium text-primary">{{ userStore.user?.nickname }}</span> 的身份留言
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <Input v-model="email" placeholder="邮箱（可选）" type="email" maxlength="100" />
        <Input v-model="website" placeholder="网站（可选）" maxlength="200" />
      </div>
      <Textarea
        v-model="content"
        placeholder="想说点什么…（500 字以内）"
        :rows="4"
        maxlength="500"
      />
      <div class="flex items-center justify-between">
        <span class="text-xs text-muted-foreground">{{ content.length }}/500</span>
        <Button :disabled="sending" @click="submit">
          <Send class="h-4 w-4" />{{ sending ? '发送中…' : '发布留言' }}
        </Button>
      </div>
    </div>
    <!-- 未登录提示 -->
    <div v-else class="neon-card flex flex-col items-center gap-4 p-10 text-center">
      <LogIn class="h-10 w-10 text-muted-foreground" />
      <div>
        <p class="font-display tracking-wide">登录后可留言</p>
        <p class="mt-1 text-sm text-muted-foreground">注册或登录后即可在留言板留下足迹</p>
      </div>
      <Button variant="outline" @click="router.push('/user/login')">
        <LogIn class="mr-1 h-4 w-4" />去登录
      </Button>
    </div>

    <!-- 留言列表 -->
    <div class="flex flex-col gap-6">
      <div class="flex items-center gap-4">
        <span class="cyber-line flex-1" />
        <p class="shrink-0 text-xs tracking-widest text-muted-foreground">全部留言 · {{ total }} 条</p>
        <span class="cyber-line flex-1" />
      </div>

      <div v-if="loading" class="flex flex-col gap-4">
        <Skeleton v-for="i in 4" :key="i" class="h-24 w-full" />
      </div>
      <template v-else>
        <div v-if="messages.length" class="flex flex-col gap-4">
          <div
            v-for="m in messages"
            :key="m.id"
            class="msg-card group"
          >
            <!-- 昵称首字头像 -->
            <span
              class="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-xl border font-display text-lg"
              :class="nameColor(m.nickname)"
            >
              {{ m.nickname.charAt(0) }}
            </span>
            <div class="flex min-w-0 flex-1 flex-col gap-1.5">
              <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span class="font-display tracking-wide">{{ m.nickname }}</span>
                <span class="text-xs text-muted-foreground">
                  {{ dayjs(m.created_at).format('YYYY-MM-DD HH:mm') }}
                </span>
              </div>
              <p class="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                {{ m.content }}
              </p>
            </div>
          </div>
        </div>
        <div v-else class="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <p class="font-display text-lg tracking-widest">FIRST SIGNAL</p>
          <p class="text-xs tracking-widest">还没有留言，来抢沙发</p>
        </div>
        <Pagination v-if="total > size" :page="page" :size="size" :total="total" @update:page="page = $event" />
      </template>
    </div>
  </section>
</template>

<style scoped>
/* 留言卡片：hover 微光 */
.msg-card {
  @apply flex items-start gap-4 rounded-xl border border-primary/15 bg-card/60 p-5 backdrop-blur-sm transition-all duration-300;
}
.msg-card:hover {
  @apply border-primary/40;
  box-shadow:
    0 0 20px hsl(var(--primary) / 0.15),
    0 0 40px hsl(var(--secondary) / 0.08);
}
</style>
