<script setup lang="ts">
import SiteHeader from '@/components/SiteHeader.vue'
import SiteFooter from '@/components/SiteFooter.vue'
</script>

<template>
  <!-- 前台布局：顶栏 + 内容（大量留白）+ 页脚 -->
  <div class="flex min-h-screen flex-col">
    <SiteHeader />
    <!-- 固定悬浮导航占位：顶部留出胶囊导航的高度；页面切换淡入过渡 -->
    <main class="container flex-1 pt-28 pb-10 md:pt-32 md:pb-16">
      <RouterView v-slot="{ Component }">
        <Transition name="page">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
    <SiteFooter />
  </div>
</template>
