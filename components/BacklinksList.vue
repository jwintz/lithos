<script setup lang="ts">
/**
 * BacklinksList Component
 *
 * Shows all notes that link to the current page.
 * Displayed at the bottom of each page.
 * Uses shared graph data composable to avoid duplicate API calls.
 */

const props = defineProps<{
  path: string
}>()

// Use shared graph data (cached, lazy-loaded)
const { backlinks, isLoading } = useBacklinks(toRef(props, 'path'))

// Format folder name
function formatFolder(folder: string): string {
  return folder
    .replace(/^\d+\./, '')
    .replace(/-/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
}
</script>

<template>
  <section v-if="!isLoading && backlinks.length > 0" class="backlinks-section">
    <h2 class="backlinks-title">
      <Icon name="heroicons:link" class="backlinks-icon" />
      Linked References
      <span class="backlinks-count">({{ backlinks.length }})</span>
    </h2>

    <ul class="backlinks-list">
      <li v-for="link in backlinks" :key="link.id" class="backlinks-item">
        <NuxtLink :to="link.path" class="backlinks-link">
          <span class="backlinks-link-title">{{ link.title }}</span>
          <span class="backlinks-link-folder">{{ formatFolder(link.folder) }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.backlinks-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid var(--ui-border);
}

.backlinks-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem;
  font-size: 1.125rem;
  font-weight: 600;
}

.backlinks-icon {
  color: var(--ui-text-muted);
}

.backlinks-count {
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  font-weight: normal;
}

.backlinks-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.5rem;
}

.backlinks-item {
  border-radius: 0.5rem;
  background: var(--ui-bg-muted);
  transition: background 0.15s ease;
}

.backlinks-item:hover {
  background: var(--ui-bg-elevated);
}

.backlinks-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  text-decoration: none;
}

.backlinks-link-title {
  color: var(--ui-primary);
  font-weight: 500;
}

.backlinks-link-folder {
  color: var(--ui-text-muted);
  font-size: 0.875rem;
}
</style>
