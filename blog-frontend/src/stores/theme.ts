import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

type ThemeMode = 'dark' | 'light'
const STORAGE_KEY = 'blog_theme'

// 主题状态：默认深色，切换持久化到 localStorage，
// 通过 html.dark class 驱动 Tailwind darkMode: 'class'
export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>((localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'dark')

  watch(
    mode,
    (val) => {
      document.documentElement.classList.toggle('dark', val === 'dark')
      localStorage.setItem(STORAGE_KEY, val)
    },
    { immediate: true }
  )

  const toggle = () => {
    mode.value = mode.value === 'dark' ? 'light' : 'dark'
  }

  return { mode, toggle }
})
