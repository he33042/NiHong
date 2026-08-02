<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
</script>

<template>
  <Button variant="ghost" size="icon" aria-label="切换深色/浅色模式" @click="theme.toggle()">
    <Sun v-if="theme.mode === 'dark'" class="h-4 w-4 text-primary" />
    <Moon v-else class="h-4 w-4 text-primary" />
  </Button>
</template>
