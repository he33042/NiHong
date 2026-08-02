<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <!-- 卡片：半透明磨砂 + 霓虹描边，hover 柔光 -->
  <div
    :class="
      cn(
        'rounded-xl border border-primary/15 bg-card/70 text-card-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_24px_hsl(var(--primary)/0.15)]',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
