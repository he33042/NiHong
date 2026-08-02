<script setup lang="ts">
// 3D 倾斜卡片：鼠标悬停时卡片跟随视角倾斜（透视旋转），
// 同时高光点跟随鼠标位置，营造动漫周边卡的立体质感
import { ref } from 'vue'

const el = ref<HTMLElement>()
const transform = ref('')
const glowX = ref('50%')
const glowY = ref('50%')
const glowOpacity = ref(0)

function onMove(e: MouseEvent) {
  const r = el.value!.getBoundingClientRect()
  const px = (e.clientX - r.left) / r.width - 0.5
  const py = (e.clientY - r.top) / r.height - 0.5
  transform.value = `perspective(900px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg) translateY(-4px)`
  glowX.value = `${((px + 0.5) * 100).toFixed(1)}%`
  glowY.value = `${((py + 0.5) * 100).toFixed(1)}%`
  glowOpacity.value = 1
}

function reset() {
  transform.value = ''
  glowOpacity.value = 0
}
</script>

<template>
  <div ref="el" class="tilt-card" :style="{ transform }" @mousemove="onMove" @mouseleave="reset">
    <div
      class="tilt-glow"
      :style="{
        background: `radial-gradient(320px circle at ${glowX} ${glowY}, hsl(var(--primary) / 0.14), transparent 65%)`,
        opacity: glowOpacity
      }"
    />
    <slot />
  </div>
</template>

<style scoped>
.tilt-card {
  position: relative;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.25s ease;
  will-change: transform;
}
.tilt-glow {
  position: absolute;
  inset: 0;
  z-index: 1;
  border-radius: inherit;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
</style>
