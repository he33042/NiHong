<script setup lang="ts">
import SimpleTaxonomyView from '@/components/admin/SimpleTaxonomyView.vue'
import { createTag, deleteTag, fetchTags, updateTag } from '@/api'
</script>

<template>
  <SimpleTaxonomyView
    title="标签管理"
    placeholder="新标签名称"
    :list-api="fetchTags"
    :create-api="createTag"
    :update-api="updateTag"
    :delete-api="deleteTag"
  />
</template>
