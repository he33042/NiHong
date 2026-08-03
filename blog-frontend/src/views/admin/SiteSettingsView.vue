<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { fetchSettings, saveSetting } from '@/api'
import { useSettingsStore } from '@/stores/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'

// 站点设置：保存到后端 setting 表
const loading = ref(true)
const saving = ref(false)

const form = reactive({
  site_name: '',
  site_desc: '',
  nickname: '',
  avatar: '',
  github: '',
  email: '',
  icp: '',
  hero_image: '',
  about_bio: '',
  about_site: '',
  cloud_provider_url: ''
})

onMounted(async () => {
  try {
    const s = await fetchSettings()
    form.site_name = s.site_name || ''
    form.site_desc = s.site_desc || ''
    form.nickname = s.nickname || ''
    form.avatar = s.avatar || ''
    form.github = s.github || ''
    form.email = s.email || ''
    form.icp = s.icp || ''
    form.hero_image = s.hero_image || ''
    form.about_bio = s.about_bio || ''
    form.about_site = s.about_site || ''
    form.cloud_provider_url = s.cloud_provider_url || ''
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  try {
    await Promise.all([
      saveSetting('site_name', form.site_name.trim()),
      saveSetting('site_desc', form.site_desc.trim()),
      saveSetting('nickname', form.nickname.trim()),
      saveSetting('avatar', form.avatar.trim()),
      saveSetting('github', form.github.trim()),
      saveSetting('email', form.email.trim()),
      saveSetting('icp', form.icp.trim()),
      saveSetting('hero_image', form.hero_image.trim()),
      saveSetting('about_bio', form.about_bio.trim()),
      saveSetting('about_site', form.about_site.trim()),
      saveSetting('cloud_provider_url', form.cloud_provider_url.trim())
    ])
    toast.success('站点设置已保存')
    // 刷新全局 settings store，让首页等组件即时生效
    useSettingsStore().refresh()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="flex flex-col gap-8">
    <div>
      <h1 class="font-display text-2xl tracking-wide">站点设置</h1>
      <p class="mt-1 text-xs text-muted-foreground">站点基础信息与博主资料，保存后生效</p>
    </div>

    <div v-if="loading" class="flex flex-col gap-4">
      <Skeleton v-for="i in 5" :key="i" class="h-12 w-full" />
    </div>

    <form v-else class="grid gap-6 lg:grid-cols-2" @submit.prevent="save">
      <!-- ===== 左列：基础配置 ===== -->
      <div class="neon-card relative overflow-hidden flex flex-col gap-6 p-6 md:p-8">
        <div class="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
        <h2 class="relative z-10 font-display text-lg tracking-wide">基础配置</h2>

        <div class="relative z-10 grid gap-6 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <label class="text-xs tracking-widest text-muted-foreground">站点名称</label>
            <Input v-model="form.site_name" placeholder="霓虹日志" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs tracking-widest text-muted-foreground">博主昵称</label>
            <Input v-model="form.nickname" placeholder="霓虹博主" />
          </div>
        </div>

        <div class="relative z-10 flex flex-col gap-2">
          <label class="text-xs tracking-widest text-muted-foreground">站点描述</label>
          <Textarea v-model="form.site_desc" :rows="3" placeholder="在星尘与流萤交错的空间里，记录代码、灵感与碎片信号。" />
        </div>

        <div class="relative z-10 flex flex-col gap-2">
          <label class="text-xs tracking-widest text-muted-foreground">头像 URL</label>
          <Input v-model="form.avatar" placeholder="https://… 或 /uploads/…" />
        </div>

        <div class="relative z-10 grid gap-6 sm:grid-cols-2">
          <div class="flex flex-col gap-2">
            <label class="text-xs tracking-widest text-muted-foreground">GitHub</label>
            <Input v-model="form.github" placeholder="https://github.com/yourname" />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-xs tracking-widest text-muted-foreground">邮箱</label>
            <Input v-model="form.email" placeholder="hi@example.com" />
          </div>
        </div>

        <div class="relative z-10 flex flex-col gap-2">
            <label class="text-xs tracking-widest text-muted-foreground">ICP 备案号（可选，展示于页脚）</label>
            <Input v-model="form.icp" placeholder="京ICP备xxxxxxxx号" />
          </div>

          <div class="relative z-10 flex flex-col gap-2">
             <label class="text-xs tracking-widest text-muted-foreground">云服务商链接（可选，展示于页脚）</label>
             <Input v-model="form.cloud_provider_url" placeholder="https://…" />
           </div>
      </div>

      <!-- ===== 右列：展示配置 ===== -->
      <div class="flex flex-col gap-6">
        <div class="neon-card relative overflow-hidden flex flex-col gap-6 p-6 md:p-8">
          <div class="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />
          <h2 class="relative z-10 font-display text-lg tracking-wide">展示配置</h2>

          <div class="relative z-10 flex flex-col gap-2">
            <label class="text-xs tracking-widest text-muted-foreground">主页装饰图 URL</label>
            <Input v-model="form.hero_image" placeholder="留空则使用默认赛博装饰图" />
          </div>

          <div class="relative z-10 flex flex-col gap-2">
            <label class="text-xs tracking-widest text-muted-foreground">个人简介（展示于关于页面）</label>
            <Textarea v-model="form.about_bio" :rows="5" placeholder="白天和服务器、集群、告警打交道，晚上在代码与星光之间写点东西…" />
          </div>

          <div class="relative z-10 flex flex-col gap-2">
            <label class="text-xs tracking-widest text-muted-foreground">关于本站（展示于关于页面）</label>
            <Textarea v-model="form.about_site" :rows="4" placeholder="「霓虹日志」是一个个人技术博客…" />
          </div>
        </div>

        <div class="flex justify-end">
          <Button type="submit" :disabled="saving">{{ saving ? '保存中…' : '保存设置' }}</Button>
        </div>
      </div>
    </form>
  </section>
</template>
