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
    <div v-if="settings.icp || cloudProvider" class="container flex flex-col items-center gap-2 border-t border-primary/10 pb-6 pt-4 text-center">
      <p v-if="cloudProvider" class="inline-flex flex-wrap items-center justify-center gap-1 text-xs text-muted-foreground">
        本站点由
        <a
          :href="settings.cloudProviderUrl"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium transition-opacity hover:opacity-80"
          :style="{ color: cloudProvider.color }"
        >
          <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M6.5 19C4.5 18 2 15.5 2 12C2 7.5 6 5 9.5 5C10 3 12 2 14 2C17 2 19.5 4.5 19.5 8C21.5 8.5 22 10 22 12.5C22 15.5 19.5 17.5 17 18" :stroke="cloudProvider.color" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 15L12 19L16 15" :stroke="cloudProvider.color" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 19V10" :stroke="cloudProvider.color" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ cloudProvider.name }}
        </a>
        提供云服务
      </p>
      <p v-if="settings.icp" class="text-xs text-muted-foreground">
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener" class="hover:text-primary transition-colors">{{ settings.icp }}</a>
      </p>
    </div>
  </footer>
</template>
