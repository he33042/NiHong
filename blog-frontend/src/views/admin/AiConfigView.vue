<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { PenLine, Sparkles } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { fetchSettings, saveSetting } from '@/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

const router = useRouter()

// AI 配置：保存到后端 setting 表（供后续 AI 辅助写作调用）
const loading = ref(true)
const saving = ref(false)

const form = reactive({
  ai_enabled: '0',
  ai_api_base: '',
  ai_api_key: '',
  ai_model: '',
  ai_prompt: ''
})

// 标记 Key 是否已设置（服务器返回脱敏值即表示已设置）
const keyIsSet = computed(() => form.ai_api_key.includes('****'))

onMounted(async () => {
  try {
    const s = await fetchSettings()
    form.ai_enabled = s.ai_enabled || '0'
    form.ai_api_base = s.ai_api_base || ''
    form.ai_api_key = s.ai_api_key || ''
    form.ai_model = s.ai_model || ''
    form.ai_prompt = s.ai_prompt || ''
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    const tasks: Promise<any>[] = [
      saveSetting('ai_enabled', form.ai_enabled),
      saveSetting('ai_prompt', form.ai_prompt)
    ]
    if (form.ai_api_base.trim()) tasks.push(saveSetting('ai_api_base', form.ai_api_base.trim()))
    // 脱敏值跳过（用户未修改 Key），否则保存新 Key
    if (form.ai_api_key.trim() && !form.ai_api_key.includes('****')) {
      tasks.push(saveSetting('ai_api_key', form.ai_api_key.trim()))
    }
    if (form.ai_model.trim()) tasks.push(saveSetting('ai_model', form.ai_model.trim()))
    await Promise.all(tasks)
    toast.success('AI 配置已保存')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="flex max-w-2xl flex-col gap-8">
    <div>
      <h1 class="font-display text-2xl tracking-wide">AI 配置</h1>
      <p class="mt-1 text-xs text-muted-foreground">配置 AI 服务的接入信息，用于后续 AI 辅助写作（生成简介、润色等）</p>
    </div>

    <div v-if="!loading" class="flex flex-wrap gap-2">
      <Button variant="outline" @click="router.push('/admin/ai-writer')">
        <PenLine class="h-4 w-4" /> AI 写作助手
      </Button>
    </div>

    <div v-if="loading" class="flex flex-col gap-4">
      <Skeleton v-for="i in 4" :key="i" class="h-12 w-full" />
    </div>

    <form v-else class="neon-card flex flex-col gap-6 p-6 md:p-8" @submit.prevent="save">
      <!-- 启用开关 -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Sparkles class="h-4 w-4 text-sakura" />
          <span class="text-sm">启用 AI 功能</span>
        </div>
        <button
          type="button"
          class="switch"
          :class="{ on: form.ai_enabled === '1' }"
          role="switch"
          :aria-checked="form.ai_enabled === '1'"
          @click="form.ai_enabled = form.ai_enabled === '1' ? '0' : '1'"
        >
          <span class="knob" />
        </button>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-xs tracking-widest text-muted-foreground">API 地址</label>
        <Input v-model="form.ai_api_base" placeholder="https://api.openai.com/v1" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-xs tracking-widest text-muted-foreground">API Key</label>
        <div class="relative">
          <Input v-model="form.ai_api_key" type="password" placeholder="sk-..." autocomplete="off" />
          <span v-if="keyIsSet" class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-400 pointer-events-none select-none">已设置</span>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-xs tracking-widest text-muted-foreground">模型</label>
        <Input v-model="form.ai_model" placeholder="gpt-4o-mini" />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-xs tracking-widest text-muted-foreground">提示词模板（{title} {content} 为占位符）</label>
        <Textarea
          v-model="form.ai_prompt"
          :rows="4"
          placeholder="请为以下博客文章生成一段 80 字以内的中文简介：&#10;标题：{title}&#10;正文：{content}"
        />
      </div>

      <div class="flex justify-end">
        <Button type="submit" :disabled="saving">{{ saving ? '保存中…' : '保存配置' }}</Button>
      </div>
    </form>
  </section>
</template>

<style scoped>
/* 开关：赛博微光风格 */
.switch {
  @apply relative h-6 w-11 rounded-full border border-primary/30 bg-muted/40 transition-all duration-300;
}
.switch.on {
  @apply border-primary/60 bg-primary/20;
  box-shadow: 0 0 12px hsl(var(--primary) / 0.4);
}
.knob {
  @apply absolute left-0.5 top-0.5 rounded-full bg-muted-foreground transition-all duration-300;
  height: 1.125rem;
  width: 1.125rem;
}
.switch.on .knob {
  transform: translateX(1.25rem);
  @apply bg-primary;
  box-shadow: 0 0 8px hsl(var(--primary) / 0.8);
}
</style>
