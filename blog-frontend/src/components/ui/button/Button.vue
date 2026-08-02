<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// 按钮变体：默认/次要/描边/幽灵/危险，带霓虹柔光 hover
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_0_14px_hsl(var(--primary)/0.35)] hover:bg-primary/90 hover:shadow-[0_0_22px_hsl(var(--primary)/0.55)]',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[0_0_14px_hsl(var(--secondary)/0.3)] hover:bg-secondary/90',
        outline:
          'border border-primary/40 text-primary hover:bg-primary/10 hover:shadow-[0_0_16px_hsl(var(--primary)/0.35)]',
        ghost: 'text-foreground/80 hover:bg-primary/10 hover:text-primary',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), { type: 'button' })
</script>

<template>
  <button :type="type" :disabled="disabled" :class="cn(buttonVariants({ variant, size }), props.class)">
    <slot />
  </button>
</template>
