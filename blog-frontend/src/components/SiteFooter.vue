<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
settings.load()

// 页脚：迷你 Logo + 站内链接 + 版权信息
const links = [
  { to: '/', label: '首页' },
  { to: '/categories', label: '分类' },
  { to: '/tags', label: '标签' },
  { to: '/about', label: '关于' },
  { to: '/guestbook', label: '留言' }
]
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
    <div v-if="settings.icp" class="border-t border-primary/10 pb-6 pt-4 text-center">
      <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener" class="text-xs text-muted-foreground hover:text-primary transition-colors">{{ settings.icp }}</a>
    </div>
  </footer>
</template>
