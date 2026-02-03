<script setup lang="ts">
/**
 * ReadingTime - Estimated reading time display
 *
 * Computes word count from page body and displays
 * estimated reading time at 200 words per minute.
 */
const props = defineProps<{
  body: any
}>()

function countWords(node: any): number {
  if (!node) return 0
  if (typeof node === 'string') return node.split(/\s+/).filter(Boolean).length
  if (node.type === 'text' && node.value) return node.value.split(/\s+/).filter(Boolean).length
  if (node.children && Array.isArray(node.children)) {
    return node.children.reduce((acc: number, child: any) => acc + countWords(child), 0)
  }
  return 0
}

const wordCount = computed(() => countWords(props.body))
const readingTime = computed(() => Math.max(1, Math.ceil(wordCount.value / 200)))
</script>

<template>
  <div class="reading-time flex items-center gap-1.5 text-sm text-muted mt-4 pt-4 border-t border-[var(--ui-border-muted)]">
    <UIcon name="i-lucide-clock" class="w-3.5 h-3.5" />
    <span>{{ readingTime }} min read</span>
  </div>
</template>
