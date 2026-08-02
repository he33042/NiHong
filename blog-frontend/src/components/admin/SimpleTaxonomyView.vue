<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Check, Pencil, Plus, Trash2, X as XIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Item {
  id: number
  name: string
}

// 分类/标签通用的增删改查视图，由父级注入对应实体的 API
const props = defineProps<{
  title: string
  placeholder: string
  listApi: () => Promise<Item[]>
  createApi: (name: string) => Promise<unknown>
  updateApi: (id: number, name: string) => Promise<unknown>
  deleteApi: (id: number) => Promise<unknown>
}>()

const items = ref<Item[]>([])
const loading = ref(true)
const newName = ref('')
const adding = ref(false)
const editingId = ref<number | null>(null)
const editingName = ref('')
const deleteTarget = ref<Item | null>(null)
const dialogOpen = ref(false)
const deleting = ref(false)

async function load() {
  loading.value = true
  try {
    items.value = await props.listApi()
  } finally {
    loading.value = false
  }
}

async function add() {
  const name = newName.value.trim()
  if (!name) return
  adding.value = true
  try {
    await props.createApi(name)
    toast.success('新增成功')
    newName.value = ''
    load()
  } finally {
    adding.value = false
  }
}

function startEdit(item: Item) {
  editingId.value = item.id
  editingName.value = item.name
}

async function saveEdit() {
  const name = editingName.value.trim()
  if (!name || editingId.value === null) return
  await props.updateApi(editingId.value, name)
  toast.success('修改成功')
  editingId.value = null
  load()
}

function confirmDelete(item: Item) {
  deleteTarget.value = item
  dialogOpen.value = true
}

async function doDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await props.deleteApi(deleteTarget.value.id)
    toast.success('删除成功')
    dialogOpen.value = false
    load()
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="flex max-w-2xl flex-col gap-8">
    <h1 class="font-display text-2xl tracking-wide">{{ title }}</h1>

    <!-- 新增 -->
    <form class="flex gap-2" @submit.prevent="add">
      <Input v-model="newName" :placeholder="placeholder" class="max-w-xs" />
      <Button type="submit" size="sm" :disabled="adding || !newName.trim()">
        <Plus class="h-4 w-4" />新增
      </Button>
    </form>

    <div v-if="loading" class="flex flex-col gap-3">
      <Skeleton v-for="i in 4" :key="i" class="h-12 w-full" />
    </div>

    <div v-else-if="items.length" class="flex flex-col gap-3">
      <div v-for="item in items" :key="item.id" class="neon-card flex items-center gap-3 p-3 px-4">
        <template v-if="editingId === item.id">
          <Input v-model="editingName" class="h-8 max-w-xs" @keyup.enter="saveEdit" />
          <Button variant="ghost" size="icon" class="text-primary" aria-label="保存" @click="saveEdit">
            <Check class="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="取消" @click="editingId = null">
            <XIcon class="h-4 w-4" />
          </Button>
        </template>
        <template v-else>
          <span class="flex-1 truncate text-sm">{{ item.name }}</span>
          <Button variant="ghost" size="icon" aria-label="编辑" @click="startEdit(item)">
            <Pencil class="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            class="text-destructive hover:text-destructive"
            aria-label="删除"
            @click="confirmDelete(item)"
          >
            <Trash2 class="h-4 w-4" />
          </Button>
        </template>
      </div>
    </div>

    <div v-else class="py-16 text-center text-sm text-muted-foreground">暂无数据</div>

    <!-- 删除确认弹窗 -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除</DialogTitle>
        </DialogHeader>
        <p class="text-sm text-muted-foreground">确定删除「{{ deleteTarget?.name }}」吗？此操作不可恢复。</p>
        <DialogFooter>
          <Button variant="ghost" @click="dialogOpen = false">取消</Button>
          <Button variant="destructive" :disabled="deleting" @click="doDelete">
            {{ deleting ? '删除中…' : '确认删除' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
