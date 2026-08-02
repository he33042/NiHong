<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import SceneBackground from '@/components/SceneBackground.vue'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
</script>

<template>
  <!-- 全局 3D 场景背景（電脳桜粒子 + 鼠标视差） -->
  <SceneBackground />
  <RouterView />
  <!-- 全局消息提示，主题跟随明暗模式 -->
  <Toaster :theme="theme.mode" position="top-center" rich-colors close-button />
</template>
