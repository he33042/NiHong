<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Loader2, Sparkles, Upload, Wand2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { MdEditor } from 'md-editor-v3'
import {
  adminFetchArticle,
  aiChat,
  createArticle,
  fetchAiSecrets,
  fetchCategories,
  fetchTags,
  updateArticle,
  uploadAttachment
} from '@/api'
import type { ArticlePayload, Category, Tag } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const router = useRouter()
const theme = useThemeStore()

// 有 id 为编辑模式，否则为新建
const id = route.params.id ? Number(route.params.id) : null

const saving = ref(false)
const categories = ref<Category[]>([])
const tags = ref<Tag[]>([])

const form = reactive<ArticlePayload>({
  title: '',
  cover: '',
  summary: '',
  content: '',
  categoryId: null,
  status: 0,
  tagIds: [],
  videoUrl: ''
})

function toggleTag(tid: number) {
  const i = form.tagIds.indexOf(tid)
  if (i >= 0) form.tagIds.splice(i, 1)
  else form.tagIds.push(tid)
}

// ==================== AI 润色 ====================
const aiEnabled = ref(false)
const polishing = ref(false)
const polishMode = ref<'polish' | 'title' | 'summary'>('polish')

async function aiPolish(mode: 'polish' | 'title' | 'summary') {
  polishMode.value = mode
  polishing.value = true
  try {
    const promptMap: Record<string, string> = {
      title:
        '请根据以下文章内容生成 3 个吸引人的中文标题（每个不超过 30 字），用数字序号列出，不要输出其他内容：\n\n' +
        form.content.slice(0, 3000),
      summary:
        '请为以下文章生成一段 80 字以内的中文简介，直接输出简介文本，不要加任何前缀：\n\n标题：' +
        form.title +
        '\n正文：' +
        form.content.slice(0, 3000),
      polish:
        '请润色优化以下 Markdown 文章，修正语法错误、优化表达，保持原有 Markdown 格式和代码块不变，不要添加额外解释，直接输出润色后的完整 Markdown：\n\n' +
        form.content
    }

    const data = await aiChat({
      messages: [{ role: 'user', content: promptMap[mode] }],
      temperature: 0.7,
      max_tokens: 4096
    })

    const text = data.choices?.[0]?.message?.content?.trim() || data.choices?.[0]?.message?.reasoning_content?.trim() || ''

    if (!text) {
      toast.error('AI 未返回内容，请重试')
      return
    }

    if (mode === 'title') {
      form.title = text
      toast.success('标题已生成')
    } else if (mode === 'summary') {
      form.summary = text
      toast.success('简介已生成')
    } else {
      form.content = text
      toast.success('文章已润色优化')
    }
  } catch (e: any) {
    toast.error(`AI 调用失败：${e.message}`)
  } finally {
    polishing.value = false
  }
}

// ==================== Typora 粘贴修复 ====================
// 拦截粘贴事件：将富文本 HTML 转为纯文本 Markdown，避免 Typora 粘贴格式丢失
const editorWrapper = ref<HTMLElement>()

function onEditorPaste(e: ClipboardEvent) {
  const html = e.clipboardData?.getData('text/html')
  if (!html) return // 没有 HTML 内容，正常粘贴
  e.preventDefault()
  const plain = e.clipboardData?.getData('text/plain') || html.replace(/<[^>]*>/g, '')
  document.execCommand('insertText', false, plain)
}

function bindPasteHandler() {
  // md-editor-v3 内部是 CodeMirror，为 .cm-content 绑定 paste 事件
  nextTick(() => {
    const cm = editorWrapper.value?.querySelector('.cm-content')
    if (cm) cm.addEventListener('paste', onEditorPaste as EventListener)
  })
}

function unbindPasteHandler() {
  const cm = editorWrapper.value?.querySelector('.cm-content')
  if (cm) cm.removeEventListener('paste', onEditorPaste as EventListener)
}

// 封面上传：调用附件接口，成功后回填 URL
const uploadingCover = ref(false)
const coverInput = ref<HTMLInputElement>()

async function onCoverUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingCover.value = true
  try {
    const res = await uploadAttachment(file)
    form.cover = res.url
    toast.success('封面上传成功')
  } catch {
    // 错误提示已由 axios 拦截器统一处理
  } finally {
    uploadingCover.value = false
    if (coverInput.value) coverInput.value.value = ''
  }
}

// 保存：status 指定发布状态（0 存草稿 / 1 发布）
async function save(status: number) {
  form.status = status
  if (!form.title.trim() || !form.content.trim()) {
    toast.error('标题和正文不能为空')
    return
  }
  saving.value = true
  try {
    if (id) await updateArticle(id, form)
    else await createArticle(form)
    toast.success(id ? '修改成功' : '创建成功')
    router.push('/admin/articles')
  } catch {
    // 错误提示已由 axios 拦截器统一处理
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  const [cs, ts] = await Promise.all([fetchCategories(), fetchTags()])
  categories.value = cs
  tags.value = ts
  // 编辑模式：回显文章数据
  if (id) {
    const a = await adminFetchArticle(id)
    form.title = a.title
    form.cover = a.cover
    form.summary = a.summary
    form.content = a.content || ''
    form.categoryId = a.category_id
    form.status = a.status
    form.tagIds = a.tags.map((t) => t.id)
    form.videoUrl = a.video_url || ''
  }
  // 加载 AI 配置（静默，失败不影响正常使用）
  try {
    const s = await fetchAiSecrets()
    aiEnabled.value = s.ai_enabled === '1'
  } catch {}
  // 绑定 Typora 粘贴修复
  bindPasteHandler()
})

onBeforeUnmount(() => unbindPasteHandler())
</script>

<template>
  <section class="flex flex-col gap-8">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="返回" @click="router.back()">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <h1 class="font-display text-2xl tracking-wide">{{ id ? '编辑文章' : '新建文章' }}</h1>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="saving" @click="save(0)">存为草稿</Button>
        <Button :disabled="saving" @click="save(1)">{{ saving ? '保存中…' : '发布' }}</Button>
      </div>
    </div>

    <!-- AI 辅助工具栏 -->
    <div
      v-if="aiEnabled"
      class="neon-card flex flex-wrap items-center gap-2 px-4 py-2.5"
    >
      <Sparkles class="h-4 w-4 text-sakura" />
      <span class="mr-1 text-xs text-muted-foreground">AI 辅助：</span>
      <Button
        variant="ghost"
        size="sm"
        :disabled="polishing || !form.content"
        @click="aiPolish('polish')"
      >
        <Loader2 v-if="polishing && polishMode === 'polish'" class="h-3.5 w-3.5 animate-spin" />
        <Wand2 v-else class="h-3.5 w-3.5" />
        润色正文
      </Button>
      <Button
        variant="ghost"
        size="sm"
        :disabled="polishing || !form.content"
        @click="aiPolish('title')"
      >
        <Loader2 v-if="polishing && polishMode === 'title'" class="h-3.5 w-3.5 animate-spin" />
        <Wand2 v-else class="h-3.5 w-3.5" />
        生成标题
      </Button>
      <Button
        variant="ghost"
        size="sm"
        :disabled="polishing || !form.content"
        @click="aiPolish('summary')"
      >
        <Loader2 v-if="polishing && polishMode === 'summary'" class="h-3.5 w-3.5 animate-spin" />
        <Wand2 v-else class="h-3.5 w-3.5" />
        生成简介
      </Button>
    </div>
    <!-- 未配置 AI 时的提示 -->
    <div
      v-else
      class="rounded-lg border border-dashed border-primary/20 px-4 py-2.5 text-xs text-muted-foreground"
    >
      <RouterLink to="/admin/ai" class="glow-text underline">配置 AI</RouterLink>
      后可启用正文润色、标题生成、简介生成
    </div>

    <div class="flex flex-col gap-6">
      <Input v-model="form.title" placeholder="文章标题" class="text-base" />
      <!-- 封面：可填 URL，也可直接上传图片 -->
      <div class="flex gap-2">
        <Input v-model="form.cover" placeholder="封面图 URL（可选）" class="flex-1" />
        <Button variant="outline" :disabled="uploadingCover" @click="coverInput?.click()">
          <Upload class="h-4 w-4" />{{ uploadingCover ? '上传中…' : '上传' }}
        </Button>
        <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverUpload" />
      </div>
      <Input v-model="form.videoUrl" placeholder="视频链接（可选，支持 YouTube / Bilibili / MP4）" />
      <Textarea v-model="form.summary" placeholder="文章简介（可选）" :rows="2" />

      <div class="grid gap-6 md:grid-cols-2">
        <div class="flex flex-col gap-2">
          <label class="text-xs tracking-widest text-muted-foreground">分类</label>
          <select
            v-model="form.categoryId"
            class="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option :value="null">未分类</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-2">
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
            <span v-if="!tags.length" class="text-xs text-muted-foreground">
              暂无标签，可先到「标签」页创建
            </span>
          </div>
        </div>
      </div>

      <!-- Markdown 编辑器，主题跟随明暗模式，支持 Typora 粘贴 -->
      <div ref="editorWrapper">
        <MdEditor v-model="form.content" :theme="theme.mode" placeholder="开始用 Markdown 记录灵感…" style="height: 520px" />
      </div>
      <p class="mt-1 text-[10px] text-muted-foreground">
        支持从 Typora 直接粘贴 Markdown 内容 · 粘贴时自动清洗富文本格式
      </p>
    </div>
  </section>
</template>
