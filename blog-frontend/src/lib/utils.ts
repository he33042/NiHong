import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// shadcn-vue 标准工具：合并 class 并解决 Tailwind 类名冲突
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 昵称首字头像底色：按昵称哈希确定性取色（青/粉/紫）
const NAME_COLORS = [
  'border-primary/40 bg-primary/15 text-primary',
  'border-sakura/40 bg-sakura/15 text-sakura',
  'border-secondary/40 bg-secondary/15 text-secondary'
]
export function nameColor(name: string) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return NAME_COLORS[h % NAME_COLORS.length]
}
