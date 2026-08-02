<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Bot, Loader2, PenLine, Send, Sparkles, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { MdEditor } from 'md-editor-v3'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useThemeStore } from '@/stores/theme'
import { aiChat, createArticle, fetchAiSecrets, fetchCategories, fetchTags } from '@/api'
import type { Category, Tag } from '@/types'

const router = useRouter()
const theme = useThemeStore()

// ==================== AI 配置 ====================
const configReady = ref(false)
const configLoading = ref(true)
const aiModel = ref('')
const promptTemplate = ref('')

// ==================== 写作面板 ====================
const topic = ref('')
const generatedContent = ref('')
const generating = ref(false)

// 对话历史记忆
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}
const chatHistory = ref<ChatMessage[]>([])
const SYSTEM_PROMPT = '你是一个专业的博客写作助手。请严格按用户的要求以 Markdown 格式输出文章正文（不要输出标题，标题由用户另行填写）。'

function clearHistory() {
  chatHistory.value = []
  toast.success('对话记忆已清除')
}

const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])

const form = reactive({
  title: '',
  cover: '',
  summary: '',
  videoUrl: '',
  categoryId: null as number | null,
  tagIds: [] as number[]
})

const saving = ref(false)

function toggleTag(tid: number) {
  const i = form.tagIds.indexOf(tid)
  if (i >= 0) form.tagIds.splice(i, 1)
  else form.tagIds.push(tid)
}

// ==================== 调用 AI 生成 Markdown ====================
async function generate() {
  const promptText = topic.value.trim()
  if (!promptText) {
    toast.error('请输入写作主题或提示词')
    return
  }
  generating.value = true
  generatedContent.value = ''

  try {
    const systemPrompt = promptTemplate.value
      .replace(/\{title\}/g, form.title || promptText)
      .replace(/\{content\}/g, promptText)

    // 追加用户消息到历史
    chatHistory.value.push({ role: 'user', content: systemPrompt })

    const data = await aiChat({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...chatHistory.value
      ],
      temperature: 0.8,
      max_tokens: 4096
    })

    const text = data.choices?.[0]?.message?.content || data.choices?.[0]?.message?.reasoning_content || ''

    if (text) {
      generatedContent.value = text
      // 追加 AI 回复到历史
      chatHistory.value.push({ role: 'assistant', content: text })
      toast.success('AI 内容生成成功，请检查并编辑')
    } else {
      chatHistory.value.pop()
      toast.error('AI 未返回有效内容，请重试')
    }
  } catch (e: any) {
    // 用户消息已在失败时回滚，这里只需确保 assistant 消息不残留
    if (chatHistory.value.length && chatHistory.value[chatHistory.value.length - 1].role === 'assistant') {
      chatHistory.value.pop()
    }
    toast.error(`AI 调用失败：${e.message}`)
  } finally {
    generating.value = false
  }
}

// ==================== 保存 / 发布 ====================
async function saveArticle(status: number) {
  if (!form.title.trim()) {
    toast.error('请填写文章标题')
    return
  }
  if (!generatedContent.value.trim()) {
    toast.error('请先生成或填写文章正文')
    return
  }
  saving.value = true
  try {
    await createArticle({
      title: form.title,
      cover: form.cover,
      summary: form.summary,
      content: generatedContent.value,
      categoryId: form.categoryId,
      status,
      tagIds: form.tagIds,
      videoUrl: form.videoUrl
    })
    toast.success(status === 1 ? '文章已发布！' : '已存为草稿')
    router.push('/admin/articles')
  } catch {
    // 错误提示已由 axios 拦截器统一处理
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const s = await fetchAiSecrets()
    const enabled = s.ai_enabled === '1'
    const apiBase = s.ai_api_base || ''
    const apiKey = s.ai_api_key || ''
    aiModel.value = s.ai_model || ''
    promptTemplate.value =
      s.ai_prompt || '请为以下主题生成一篇高质量的博客技术文章，使用 Markdown 格式，包含代码示例：\n主题：{content}'

    configReady.value = enabled && !!apiBase && !!apiKey && !!aiModel.value
  } catch {
    // 配置加载失败
  } finally {
    configLoading.value = false
  }

  const [cs, ts] = await Promise.all([fetchCategories(), fetchTags()])
  categories.value = cs
  tags.value = ts
})
</script>

<template>
  <section class="flex flex-col gap-6">
    <!-- 顶栏 -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="返回" @click="router.back()">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <h1 class="flex items-center gap-2 font-display text-2xl tracking-wide">
          <Sparkles class="h-5 w-5 text-sakura" /> AI 写作助手
        </h1>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="saving || !generatedContent" @click="saveArticle(0)">
          <PenLine class="h-4 w-4" /> 存为草稿
        </Button>
        <Button :disabled="saving || !generatedContent" @click="saveArticle(1)">
          {{ saving ? '发布中…' : '发布文章' }}
        </Button>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="configLoading" class="flex flex-col gap-4">
      <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
    </div>

    <!-- 未配置 AI -->
    <div v-else-if="!configReady" class="neon-card flex flex-col items-center gap-4 p-10 text-center">
      <Bot class="h-12 w-12 text-muted-foreground" />
      <div>
        <p class="font-display text-lg tracking-wide">尚未配置 AI 服务</p>
        <p class="mt-1 text-sm text-muted-foreground">
          请先在
          <RouterLink to="/admin/ai" class="glow-text underline">AI 配置</RouterLink>
          页面填写 API 地址、Key 和模型信息
        </p>
      </div>
      <Button variant="outline" @click="router.push('/admin/ai')">
        <Sparkles class="h-4 w-4" /> 前往配置
      </Button>
    </div>

    <!-- AI 写作主面板 -->
    <template v-else>
      <!-- 输入区 -->
      <div class="neon-card flex flex-col gap-3 p-5">
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 text-xs tracking-widest text-muted-foreground">
            <Send class="h-3.5 w-3.5" /> 写作主题 / 提示词
          </label>
          <span
            v-if="chatHistory.length"
            class="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary/70"
          >
            记忆 {{ Math.ceil(chatHistory.length / 2) }} 轮对话
          </span>
        </div>
        <Textarea
          v-model="topic"
          placeholder="例如：写一篇关于 Vue3 Composition API 最佳实践的技术博客…"
          :rows="3"
          class="min-h-[80px]"
        />
        <div class="flex justify-end gap-2">
          <Button
            v-if="chatHistory.length"
            variant="ghost"
            size="sm"
            @click="clearHistory"
          >
            <Trash2 class="h-3.5 w-3.5" /> 清除记忆
          </Button>
          <Button :disabled="generating || !topic.trim()" @click="generate">
            <Loader2 v-if="generating" class="h-4 w-4 animate-spin" />
            <Bot v-else class="h-4 w-4" />
            {{ generating ? 'AI 生成中…' : '开始生成' }}
          </Button>
        </div>
      </div>

      <!-- 生成内容展示 / 编辑区 -->
      <div v-if="generatedContent || generating" class="flex flex-col gap-4">
        <!-- Markdown 编辑器 -->
        <div class="neon-card overflow-hidden">
          <div class="flex items-center gap-2 border-b border-primary/10 px-5 py-3">
            <Bot class="h-4 w-4 text-primary" />
            <span class="text-sm font-medium">Markdown 正文（可编辑）</span>
            <span class="ml-auto text-[10px] text-muted-foreground">
              模型：{{ aiModel }}
            </span>
          </div>
          <MdEditor
            v-model="generatedContent"
            :theme="theme.mode"
            placeholder="AI 正在为你写作…"
            style="height: 480px"
          />
        </div>

        <!-- 文章元数据 -->
        <div class="neon-card flex flex-col gap-5 p-5">
          <h3 class="flex items-center gap-2 text-sm font-medium tracking-wide">
            <PenLine class="h-4 w-4 text-sakura" /> 文章信息
          </h3>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs tracking-widest text-muted-foreground">标题 *</label>
              <Input v-model="form.title" placeholder="文章标题" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs tracking-widest text-muted-foreground">封面图 URL</label>
              <Input v-model="form.cover" placeholder="https://..." />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs tracking-widest text-muted-foreground">简介</label>
            <Textarea v-model="form.summary" placeholder="文章简介（可选）" :rows="2" />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs tracking-widest text-muted-foreground">视频链接（可选）</label>
            <Input v-model="form.videoUrl" placeholder="支持 YouTube / Bilibili / MP4" />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs tracking-widest text-muted-foreground">分类</label>
              <select
                v-model="form.categoryId"
                size="6"
                class="h-auto w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option :value="null">未分类</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs tracking-widest text-muted-foreground">标签</label>
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-for="t in tags"
                  :key="t.id"
                  type="button"
                  class="chip"
                  :class="{ active: form.tagIds.includes(t.id) }"
                  @click="toggleTag(t.id)"
                >
                  # {{ t.name }}
                </button>
                <span v-if="!tags.length" class="text-xs text-muted-foreground">暂无标签</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
