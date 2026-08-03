<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Activity, Cloud, Container, Github, Mail, Rss, Terminal } from 'lucide-vue-next'
import { AVATAR_IMG } from '@/lib/assets'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const settings = useSettingsStore()
settings.load()

// 关于我（静态页）：头像 / 自我介绍 / 技能标签 / 站点介绍 / 联系方式
// 装饰元素（3D 线框立方体、轨道环）均为 pointer-events-none，不遮挡文字

// 技能栈
const skills = [
  { icon: Terminal, name: 'Linux', desc: '生产环境主力系统，Shell 与性能调优' },
  { icon: Activity, name: '运维', desc: '监控告警、故障排查、自动化脚本' },
  { icon: Cloud, name: '云原生', desc: 'Kubernetes、微服务与服务网格' },
  { icon: Container, name: '容器', desc: 'Docker、镜像优化、容器编排' }
]

// 站点技术栈
const siteStack = ['Vue 3', 'TypeScript', 'Tailwind CSS', 'three.js', 'Express', 'MySQL']

function searchTag(tech: string) {
  router.push({ path: '/search', query: { q: tech } })
}

// 联系方式
const contacts = [
  { icon: Github, label: 'GitHub', value: settings.github || 'github.com/neon-logger', href: settings.github || 'https://github.com' },
  { icon: Mail, label: '邮箱', value: settings.email || 'hi@neonlog.dev', href: settings.email ? `mailto:${settings.email}` : 'mailto:hi@neonlog.dev' },
  { icon: Rss, label: 'RSS', value: '订阅本站更新', href: '/' }
]
</script>

<template>
  <section class="mx-auto flex max-w-3xl flex-col gap-16 md:gap-20">
    <!-- ================= 页头 ================= -->
    <header class="flex animate-fade-up flex-col items-center gap-4 text-center">
      <p class="text-xs tracking-[0.5em] text-sakura">ABOUT</p>
      <h1 class="glow-text font-display text-4xl tracking-wide md:text-5xl">关于我</h1>
      <div class="cyber-line w-48" />
    </header>

    <!-- ================= 博主卡片 ================= -->
    <div class="neon-card relative animate-fade-up overflow-hidden p-8 md:p-10" style="animation-delay: 80ms">
      <!-- 四角几何装饰线 -->
      <span class="cyber-corner left-0 top-0 border-l border-t" />
      <span class="cyber-corner right-0 top-0 border-r border-t" />
      <span class="cyber-corner bottom-0 left-0 border-b border-l" />
      <span class="cyber-corner bottom-0 right-0 border-b border-r" />

      <!-- 3D 线框立方体装饰（右上角，不遮挡文字） -->
      <div class="cube-wrap -right-2 -top-2 hidden sm:block" aria-hidden="true">
        <div class="cube">
          <span class="cube-face cube-front" />
          <span class="cube-face cube-back" />
          <span class="cube-face cube-right" />
          <span class="cube-face cube-left" />
          <span class="cube-face cube-top" />
          <span class="cube-face cube-bottom" />
        </div>
      </div>

      <div class="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
        <!-- 头像：辉光描边 + 在线状态点 -->
        <div class="relative shrink-0">
          <img
            :src="settings.avatar || AVATAR_IMG"
            alt="博主头像"
            class="h-28 w-28 rounded-2xl border border-primary/30 object-cover shadow-[0_0_28px_hsl(var(--primary)/0.35)] md:h-32 md:w-32"
          />
          <span
            class="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]"
            title="在线"
          />
        </div>

        <!-- 自我介绍 -->
        <div class="flex flex-col gap-3 text-center sm:text-left">
          <div>
            <h2 class="font-display text-2xl tracking-wide">{{ settings.nickname }}</h2>
            <p class="mt-1 text-xs tracking-[0.25em] text-primary/80">运维工程师 · 云原生爱好者</p>
          </div>
          <p class="text-sm leading-loose text-muted-foreground">
            {{ settings.aboutBio || '白天和服务器、集群、告警打交道，晚上在代码与星光之间写点东西。喜欢把复杂的基础设施讲得简单明白，也喜欢给冰冷的终端加一点霓虹。这里记录我的技术实践、踩坑笔记和一些一闪而过的灵感。' }}
          </p>
        </div>
      </div>
    </div>

    <!-- ================= 技能标签 ================= -->
    <div class="flex animate-fade-up flex-col gap-8" style="animation-delay: 140ms">
      <div class="flex items-center gap-4">
        <h2 class="shrink-0 font-display text-xl tracking-wide">技能栈</h2>
        <span class="cyber-line flex-1" />
        <span class="text-xs tracking-[0.3em] text-muted-foreground">SKILLS</span>
      </div>
      <div class="grid gap-5 sm:grid-cols-2">
        <div v-for="s in skills" :key="s.name" class="skill-card group">
          <span class="skill-icon">
            <component :is="s.icon" class="h-5 w-5" />
          </span>
          <div class="flex flex-col gap-1">
            <span class="font-display text-lg tracking-wide">{{ s.name }}</span>
            <span class="text-xs leading-relaxed text-muted-foreground">{{ s.desc }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= 站点介绍 ================= -->
    <div class="relative animate-fade-up flex flex-col gap-8" style="animation-delay: 200ms">
      <!-- 轨道环装饰（右下角，不遮挡文字） -->
      <div class="orbit-ring -bottom-10 -right-6 hidden md:block" aria-hidden="true" />

      <div class="flex items-center gap-4">
        <h2 class="shrink-0 font-display text-xl tracking-wide">关于本站</h2>
        <span class="cyber-line flex-1" />
        <span class="text-xs tracking-[0.3em] text-muted-foreground">SITE</span>
      </div>

      <div class="neon-card flex flex-col gap-5 p-8">
        <p class="text-sm leading-loose text-muted-foreground">
          {{ settings.aboutSite || `「${settings.siteName}」是一个个人技术博客：前台是星尘流萤的 3D 赛博空间，后台是简洁高效的内容管理台。文章以 Markdown 书写，支持分类与标签聚合，明暗双主题随心情切换。` }}
        </p>
        <div class="flex flex-wrap gap-2">
          <a v-for="t in siteStack" :key="t" :href="`/search?q=${encodeURIComponent(t)}`" @click.prevent="searchTag(t)" class="chip hover:border-primary/50 hover:text-primary hover:shadow-[0_0_12px_hsl(var(--primary)/0.3)] transition-all duration-300">{{ t }}</a>
        </div>
      </div>
    </div>

    <!-- ================= 联系方式 ================= -->
    <div class="flex animate-fade-up flex-col gap-8" style="animation-delay: 260ms">
      <div class="flex items-center gap-4">
        <h2 class="shrink-0 font-display text-xl tracking-wide">联系我</h2>
        <span class="cyber-line flex-1" />
        <span class="text-xs tracking-[0.3em] text-muted-foreground">CONTACT</span>
      </div>
      <div class="grid gap-5 sm:grid-cols-3">
        <a
          v-for="c in contacts"
          :key="c.label"
          :href="c.href"
          target="_blank"
          rel="noopener"
          class="contact-card group"
        >
          <component :is="c.icon" class="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
          <span class="text-xs tracking-widest text-muted-foreground">{{ c.label }}</span>
          <span class="text-sm">{{ c.value }}</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ===== 技能卡片：hover 微光上浮 ===== */
.skill-card {
  @apply flex items-start gap-4 rounded-xl border border-primary/15 bg-card/60 p-5 backdrop-blur-sm transition-all duration-300;
}
.skill-card:hover {
  @apply -translate-y-0.5 border-primary/45;
  box-shadow:
    0 0 20px hsl(var(--primary) / 0.18),
    0 0 40px hsl(var(--secondary) / 0.1);
}
.skill-icon {
  @apply flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/40 text-primary transition-all duration-300;
  box-shadow: 0 0 12px hsl(var(--primary) / 0.25);
}
.skill-card:hover .skill-icon {
  @apply border-sakura/60 text-sakura;
  box-shadow: 0 0 16px hsl(var(--sakura) / 0.4);
}

/* ===== 联系卡片：hover 微光上浮 ===== */
.contact-card {
  @apply flex flex-col items-center gap-2 rounded-xl border border-primary/15 bg-card/60 p-6 text-center backdrop-blur-sm transition-all duration-300;
}
.contact-card:hover {
  @apply -translate-y-0.5 border-primary/45;
  box-shadow: 0 0 24px hsl(var(--primary) / 0.2);
}

/* ===== 3D 线框立方体装饰（纯 CSS 3D，慢速旋转） ===== */
.cube-wrap {
  position: absolute;
  width: 84px;
  height: 84px;
  perspective: 600px;
  opacity: 0.35;
  pointer-events: none;
}
.cube {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  animation: spin-cube 18s linear infinite;
}
.cube-face {
  position: absolute;
  inset: 0;
  border: 1px solid hsl(var(--primary) / 0.7);
  background: hsl(var(--primary) / 0.04);
  box-shadow: inset 0 0 12px hsl(var(--primary) / 0.25);
}
.cube-front { transform: translateZ(42px); }
.cube-back { transform: rotateY(180deg) translateZ(42px); }
.cube-right { transform: rotateY(90deg) translateZ(42px); }
.cube-left { transform: rotateY(-90deg) translateZ(42px); }
.cube-top { transform: rotateX(90deg) translateZ(42px); }
.cube-bottom { transform: rotateX(-90deg) translateZ(42px); }
@keyframes spin-cube {
  from { transform: rotateX(-20deg) rotateY(0deg); }
  to { transform: rotateX(-20deg) rotateY(360deg); }
}

/* ===== 轨道虚线环装饰（慢速旋转） ===== */
.orbit-ring {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 9999px;
  border: 1px dashed hsl(var(--sakura) / 0.45);
  box-shadow: 0 0 16px hsl(var(--sakura) / 0.15);
  opacity: 0.5;
  pointer-events: none;
  animation: spin-slow 24s linear infinite;
}
@keyframes spin-slow {
  to { transform: rotate(360deg); }
}

/* 尊重系统减弱动态偏好 */
@media (prefers-reduced-motion: reduce) {
  .cube,
  .orbit-ring {
    animation: none;
  }
}
</style>
