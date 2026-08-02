<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// 徽标变体：主色柔光 / 紫色柔光 / 描边
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/40 bg-primary/10 text-primary',
        secondary: 'border-secondary/40 bg-secondary/10 text-secondary',
        outline: 'border-border text-muted-foreground'
      }
    },
    defaultVariants: { variant: 'default' }
  }
)

type BadgeVariants = VariantProps<typeof badgeVariants>
const props = defineProps<{ variant?: BadgeVariants['variant']; class?: HTMLAttributes['class'] }>()
</script>

<template>
  <span :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </span>
</template>
