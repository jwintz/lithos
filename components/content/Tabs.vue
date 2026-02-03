<script setup lang="ts">
import { ref, provide } from 'vue'

const activeIndex = ref(0)
const tabs = ref<{ label: string; icon?: string }[]>([])

function registerTab(tab: { label: string; icon?: string }) {
  const index = tabs.value.length
  tabs.value.push(tab)
  return index
}

provide('tabs-context', {
  activeIndex,
  registerTab
})
</script>

<template>
  <div class="my-6 border rounded-md border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
    <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 rounded-t-md">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        @click="activeIndex = index"
        class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px]"
        :class="[
          activeIndex === index
            ? 'border-primary-500 text-primary-500 bg-white dark:bg-gray-900'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700'
        ]"
      >
        <Icon v-if="tab.icon" :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>
    <div class="p-4 rounded-b-md">
      <slot />
    </div>
  </div>
</template>
