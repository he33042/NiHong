<script setup lang="ts">
import SimpleTaxonomyView from '@/components/admin/SimpleTaxonomyView.vue'
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '@/api'
</script>

<template>
  <SimpleTaxonomyView
    title="分类管理"
    placeholder="新分类名称"
    :list-api="fetchCategories"
    :create-api="createCategory"
    :update-api="updateCategory"
    :delete-api="deleteCategory"
  />
</template>
