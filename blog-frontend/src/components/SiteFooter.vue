<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { getCloudProviderInfo } from '@/lib/cloudProviders'

const settings = useSettingsStore()
settings.load()

const links = [
  { to: '/', label: '首页' },
  { to: '/categories', label: '分类' },
  { to: '/tags', label: '标签' },
  { to: '/about', label: '关于' },
  { to: '/guestbook', label: '留言' }
]

const cloudProvider = computed(() => getCloudProviderInfo(settings.cloudProviderUrl))
</script>

<template>
  <footer class="mt-20 md:mt-28">
    <div class="cyber-line" />
    <div class="container flex flex-col items-center justify-between gap-5 py-8 md:flex-row">
      <!-- 迷你 Logo -->
      <RouterLink to="/" class="flex flex-col leading-none">
        <span class="font-display text-base tracking-widest text-foreground/90">{{ settings.siteName }}</span>
        <span class="mt-0.5 text-[9px] tracking-[0.35em] text-muted-foreground">NEON LOG</span>
      </RouterLink>

      <!-- 站内链接 -->
      <nav class="flex items-center gap-6 text-xs text-muted-foreground">
        <RouterLink v-for="l in links" :key="l.to" :to="l.to" class="transition-colors hover:text-primary">
          {{ l.label }}
        </RouterLink>
      </nav>

      <span class="text-xs text-muted-foreground">© 2026 {{ settings.siteName }} · 以代码记录灵感</span>
    </div>
    <div v-if="settings.icp || cloudProvider" class="flex flex-col items-center gap-3 border-t border-primary/10 pb-6 pt-4 text-center">
      <a
        v-if="cloudProvider"
        :href="settings.cloudProviderUrl"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80 hover:shadow-[0_0_12px_var(--glow)]"
        :style="{ borderColor: cloudProvider.color + '40', color: cloudProvider.color, '--glow': cloudProvider.color + '40' }"
      >
        <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
          <path d="M6.5 19C4.5 18 2 15.5 2 12C2 7.5 6 5 9.5 5C10 3 12 2 14 2C17 2 19.5 4.5 19.5 8C21.5 8.5 22 10 22 12.5C22 15.5 19.5 17.5 17 18" :stroke="cloudProvider.color" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M8 15L12 19L16 15" :stroke="cloudProvider.color" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 19V10" :stroke="cloudProvider.color" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ cloudProvider.name }}</span>
        <span class="text-muted-foreground">提供云服务</span>
      </a>
      <p v-if="settings.icp" class="text-xs text-muted-foreground">
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener" class="hover:text-primary transition-colors">{{ settings.icp }}</a>
      </p>
    </div>
  </footer>
</template>
