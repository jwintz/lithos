<script setup lang="ts">
/**
 * GlobalGraphModal
 * 
 * Listens for 'lithos:open-graph-modal' event from header button
 * and shows the graph modal.
 * 
 * Gets the current path from the route to pass to GraphModal.
 */
const route = useRoute()
const showModal = ref(false)

// Get current page path for local graph context
const currentPath = computed(() => route.path)

onMounted(() => {
  window.addEventListener('lithos:open-graph-modal', openModal)
})

onUnmounted(() => {
  window.removeEventListener('lithos:open-graph-modal', openModal)
})

function openModal() {
  showModal.value = true
}
</script>

<template>
  <GraphModal v-model:open="showModal" :current-path="currentPath" />
</template>
