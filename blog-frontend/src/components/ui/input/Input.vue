<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

defineOptions({ inheritAttrs: false })
const props = defineProps<{ class?: HTMLAttributes['class'] }>()

// 支持 v-model 双向绑定
const model = defineModel<string>({ default: '' })
</script>

<template>
  <input
    v-model="model"
    v-bind="$attrs"
    :class="
      cn(
        'flex h-9 w-full rounded-md border border-input bg-background/60 px-3 py-1 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
  />
</template>
