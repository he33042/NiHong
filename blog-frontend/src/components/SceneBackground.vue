<script setup lang="ts">
// 3D 场景背景（流萤星轨）：
// - 远景星尘：大量细小柔光粒子缓慢漂浮
// - 近景流萤：少量大而亮的萤火，明灭闪烁、上下漂游
// - 霓虹线框几何体缓旋 + 鼠标视差相机，明暗主题自适应
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { useThemeStore } from '@/stores/theme'

const theme = useThemeStore()
const container = ref<HTMLElement>()

// 粒子调色板：青 / 粉 / 紫 / 白
const PALETTE = ['#67e8f9', '#f0abfc', '#a5b4fc', '#ffffff']

interface Cloud {
  points: THREE.Points
  speeds: Float32Array
  phases: Float32Array
  count: number
  baseOpacity: number
  twinkle: boolean
}

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let clouds: Cloud[] = []
let shapes: THREE.Mesh[] = []
let raf = 0
let mouseX = 0
let mouseY = 0
const clock = new THREE.Clock()

// 圆形柔光贴图（星尘/萤火的光点）
function createGlowTexture(): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.35, 'rgba(255,255,255,0.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

interface CloudOptions {
  count: number
  size: number
  opacity: number
  area: [number, number, number]
  speedMin: number
  speedMax: number
  twinkle: boolean
}

// 构建一团粒子云
function buildCloud(glowTex: THREE.Texture, opts: CloudOptions): Cloud {
  const positions = new Float32Array(opts.count * 3)
  const colors = new Float32Array(opts.count * 3)
  const speeds = new Float32Array(opts.count)
  const phases = new Float32Array(opts.count)
  const color = new THREE.Color()

  for (let i = 0; i < opts.count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * opts.area[0]
    positions[i * 3 + 1] = (Math.random() - 0.5) * opts.area[1]
    positions[i * 3 + 2] = (Math.random() - 0.5) * opts.area[2]
    color.set(PALETTE[Math.floor(Math.random() * PALETTE.length)])
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
    speeds[i] = opts.speedMin + Math.random() * (opts.speedMax - opts.speedMin)
    phases[i] = Math.random() * Math.PI * 2
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const mat = new THREE.PointsMaterial({
    size: opts.size,
    map: glowTex,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    opacity: opts.opacity,
    blending: THREE.AdditiveBlending
  })
  const points = new THREE.Points(geo, mat)
  scene.add(points)
  return { points, speeds, phases, count: opts.count, baseOpacity: opts.opacity, twinkle: opts.twinkle }
}

// 霓虹线框几何体：赛博空间感装饰
function buildShapes() {
  const defs: Array<{ geo: THREE.BufferGeometry; color: string; pos: [number, number, number]; speed: number }> = [
    { geo: new THREE.TorusKnotGeometry(1.6, 0.4, 120, 16), color: '#22d3ee', pos: [-7.5, 2.5, -4], speed: 0.003 },
    { geo: new THREE.IcosahedronGeometry(1.4, 0), color: '#f0abfc', pos: [7.5, -2.2, -3], speed: 0.004 },
    { geo: new THREE.OctahedronGeometry(1.1, 0), color: '#a5b4fc', pos: [6.5, 3.2, -5], speed: 0.0025 }
  ]
  shapes = defs.map((d) => {
    const mat = new THREE.MeshBasicMaterial({ color: d.color, wireframe: true, transparent: true, opacity: 0.26 })
    const mesh = new THREE.Mesh(d.geo, mat)
    mesh.position.set(...d.pos)
    mesh.userData.speed = d.speed
    scene.add(mesh)
    return mesh
  })
}

function onMouseMove(e: MouseEvent) {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2
}

function onResize() {
  if (!renderer || !container.value) return
  const { clientWidth: w, clientHeight: h } = container.value
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

function animate() {
  raf = requestAnimationFrame(animate)
  const t = clock.getElapsedTime()

  for (const cloud of clouds) {
    const pos = cloud.points.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < cloud.count; i++) {
      // 缓慢上浮 + 正弦摇摆，出界回收
      let y = pos.getY(i) + cloud.speeds[i]
      const x = pos.getX(i) + Math.sin(t * 0.6 + cloud.phases[i]) * 0.004
      if (y > 7.5) y = -7.5
      pos.setY(i, y)
      pos.setX(i, x > 14 ? -14 : x)
    }
    pos.needsUpdate = true

    // 流萤明灭闪烁
    if (cloud.twinkle) {
      ;(cloud.points.material as THREE.PointsMaterial).opacity =
        cloud.baseOpacity + Math.sin(t * 1.6) * 0.15
    }
  }

  // 线框几何体缓旋
  for (const m of shapes) {
    m.rotation.x += m.userData.speed
    m.rotation.y += m.userData.speed * 1.3
  }

  // 相机鼠标视差（缓动逼近，柔和跟随）
  camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.04
  camera.position.y += (-mouseY * 0.8 - camera.position.y) * 0.04
  camera.lookAt(0, 0, 0)

  renderer!.render(scene, camera)
}

// 主题切换：浅色模式改用普通混合并弱化（加色混合在浅底上不可见）
function applyTheme(mode: 'dark' | 'light') {
  if (!clouds.length) return
  for (const cloud of clouds) {
    const mat = cloud.points.material as THREE.PointsMaterial
    mat.blending = mode === 'dark' ? THREE.AdditiveBlending : THREE.NormalBlending
    cloud.baseOpacity = mode === 'dark' ? 0.85 : 0.5
    mat.opacity = cloud.baseOpacity
    mat.needsUpdate = true
  }
  for (const m of shapes) (m.material as THREE.MeshBasicMaterial).opacity = mode === 'dark' ? 0.26 : 0.15
}
watch(() => theme.mode, applyTheme)

onMounted(() => {
  const el = container.value!
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.1, 100)
  camera.position.z = 9

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(el.clientWidth, el.clientHeight)
  el.appendChild(renderer.domElement)

  const glowTex = createGlowTexture()
  const isMobile = window.innerWidth < 768
  // 远景星尘：小而多，漂浮极慢
  clouds.push(
    buildCloud(glowTex, {
      count: isMobile ? 220 : 500,
      size: 0.07,
      opacity: 0.85,
      area: [28, 15, 8],
      speedMin: 0.0008,
      speedMax: 0.0025,
      twinkle: false
    })
  )
  // 近景流萤：大而少，明灭闪烁
  clouds.push(
    buildCloud(glowTex, {
      count: isMobile ? 28 : 60,
      size: 0.3,
      opacity: 0.85,
      area: [22, 13, 6],
      speedMin: 0.0015,
      speedMax: 0.004,
      twinkle: true
    })
  )
  buildShapes()
  applyTheme(theme.mode)

  window.addEventListener('mousemove', onMouseMove, { passive: true })
  window.addEventListener('resize', onResize)
  animate()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)
  // 释放 GPU 资源
  for (const cloud of clouds) {
    cloud.points.geometry.dispose()
    const mat = cloud.points.material as THREE.PointsMaterial
    mat.map?.dispose()
    mat.dispose()
  }
  for (const m of shapes) {
    m.geometry.dispose()
    ;(m.material as THREE.Material).dispose()
  }
  renderer?.dispose()
  renderer?.domElement.remove()
})
</script>

<template>
  <div class="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
    <!-- 氛围渐变底色 -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)]" />
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_85%_100%,hsl(var(--sakura)/0.1),transparent)]" />
    <!-- three.js 画布层 -->
    <div ref="container" class="absolute inset-0" />
    <!-- 底部渐隐，保证内容可读性 -->
    <div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
  </div>
</template>
