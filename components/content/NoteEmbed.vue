<script setup lang="ts">
/**
 * NoteEmbed Component
 *
 * Renders embedded notes or base files with transclusion support.
 * Handles: ![[Note]], ![[Note.base]], ![[Note.base#Section]]
 */

const props = defineProps<{
  src: string
  section?: string
  alias?: string
  depth?: number
}>()

// Check if this is a base file embed
const isBaseFile = computed(() => {
  return props.src.toLowerCase().endsWith('.base')
})

// Extract base name and section from src
const baseName = computed(() => {
  return props.src.replace(/\.base$/i, '')
})

// Section is passed as prop from transform, or extract from src
const targetSection = computed(() => {
  return props.section || null
})

// Recursion protection (only for note embeds)
const maxDepth = 3
const currentDepth = props.depth ?? 0
const canEmbed = currentDepth < maxDepth

// Resolve the note path from src
const normalizedSrc = computed(() => {
  return props.src
    .toLowerCase()
    .replace(/\.base$/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
})

// Fetch base file configuration via API
const { data: baseConfig, error: baseError } = await useAsyncData(
  `base-${props.src}`,
  async () => {
    if (!isBaseFile.value) return null

    try {
      const config = await $fetch(`/api/base/${baseName.value}`)
      return config
    } catch (e) {
      console.warn(`[NoteEmbed] Base not found: ${baseName.value}`)
      return null
    }
  }
)

// Filter views by section if specified
const filteredViews = computed(() => {
  if (!baseConfig.value?.views) return []
  
  if (targetSection.value) {
    // Find views matching the section name
    const sectionLower = targetSection.value.toLowerCase()
    return baseConfig.value.views.filter((v: any) => 
      v.name?.toLowerCase().includes(sectionLower)
    )
  }
  
  return baseConfig.value.views
})

// Fetch the embedded note content (only for non-base embeds)
const { data: note, status } = await useAsyncData(
  `embed-${props.src}-${currentDepth}`,
  async () => {
    if (isBaseFile.value) return null

    const allDocs = await queryCollection('docs').all()
    const srcLower = props.src.toLowerCase()

    // Try exact title match
    const byTitle = allDocs.find(doc =>
      doc.title?.toLowerCase() === srcLower
    )
    if (byTitle) return byTitle

    // Try partial title match
    const byTitlePartial = allDocs.find(doc =>
      doc.title?.toLowerCase().includes(srcLower)
    )
    if (byTitlePartial) return byTitlePartial

    // Try path match
    const byPath = allDocs.find(doc =>
      doc.path?.includes(normalizedSrc.value)
    )
    return byPath || null
  }
)

// Display title
const displayTitle = computed(() => {
  return props.alias || note.value?.title || baseConfig.value?.title || props.src
})

// Note path for linking
const notePath = computed(() => {
  return note.value?.path || `/${normalizedSrc.value}`
})

// Section anchor
const sectionAnchor = computed(() => {
  if (!props.section) return ''
  return '#' + props.section.toLowerCase().replace(/\s+/g, '-')
})
</script>

<template>
  <!-- Base file embed: render ObsidianBase component -->
  <div v-if="isBaseFile" class="base-embed">
    <div v-if="baseConfig && filteredViews.length > 0">
      <ObsidianBase
        :source="baseConfig.source || ''"
        :filters="baseConfig.filters || {}"
        :views="filteredViews"
        :properties="baseConfig.properties || {}"
        :title="targetSection || baseConfig.title"
      />
    </div>
    <div v-else-if="baseConfig && filteredViews.length === 0 && targetSection" class="embed-error">
      <Icon name="heroicons:exclamation-triangle" />
      Section not found: <code>{{ props.src }}#{{ targetSection }}</code>
    </div>
    <div v-else class="embed-error">
      <Icon name="heroicons:exclamation-triangle" />
      Base file not found: <code>{{ props.src }}</code>
    </div>
  </div>

  <!-- Note embed: render with cartridge -->
  <div v-else class="note-embed" :class="{ 'depth-warning': currentDepth >= maxDepth - 1 }">
    <details open class="embed-cartridge">
      <summary class="embed-header">
        <span class="embed-icon">
          <Icon name="heroicons:document-text" size="16" />
        </span>
        <NuxtLink
          v-if="note"
          :to="notePath + sectionAnchor"
          class="embed-title-link"
        >
          {{ displayTitle }}
        </NuxtLink>
        <span v-else class="embed-title-missing">
          {{ displayTitle }}
        </span>
        <span class="embed-chevron">
          <Icon name="heroicons:chevron-down" size="14" />
        </span>
      </summary>

      <div class="embed-content">
        <div v-if="status === 'pending'" class="embed-loading">
          <Icon name="heroicons:arrow-path" class="animate-spin" />
          Loading...
        </div>

        <div v-else-if="!note" class="embed-error">
          <Icon name="heroicons:exclamation-triangle" />
          Note not found: <code>{{ props.src }}</code>
        </div>

        <div v-else-if="!canEmbed" class="embed-error">
          <Icon name="heroicons:exclamation-circle" />
          Max embed depth reached
        </div>

        <ContentRenderer v-else :value="note" class="embed-body" />
      </div>
    </details>
  </div>
</template>

<style scoped>
.base-embed {
  margin: 1rem 0;
}

.note-embed {
  margin: 1rem 0;
  border-radius: 0.5rem;
  border: 1px solid var(--ui-border);
  background: var(--ui-bg-muted);
  overflow: hidden;
}

.note-embed.depth-warning {
  border-color: var(--ui-warning);
}

.embed-cartridge {
  width: 100%;
}

.embed-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  user-select: none;
  background: var(--ui-bg-elevated);
  border-bottom: 1px solid var(--ui-border);
  transition: background 0.15s ease;
}

.embed-header:hover {
  background: var(--ui-bg-accented);
}

.embed-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ui-text-muted);
  flex-shrink: 0;
}

.embed-title-link {
  flex: 1;
  font-weight: 500;
  color: var(--ui-primary);
  text-decoration: none;
}

.embed-title-link:hover {
  text-decoration: underline;
}

.embed-title-missing {
  flex: 1;
  font-weight: 500;
  color: var(--ui-text-muted);
  font-style: italic;
}

.embed-chevron {
  color: var(--ui-text-muted);
  transition: transform 0.2s ease;
  /* Ensure rotation happens around the center of the icon */
  display: flex;
  align-items: center;
  justify-content: center;
}

details[open] .embed-chevron {
  transform: rotate(180deg);
}

.embed-content {
  padding: 1rem;
}

.embed-loading,
.embed-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  font-size: 0.875rem;
}

.embed-loading {
  color: var(--ui-text-muted);
}

.embed-error {
  color: var(--ui-danger);
  background: var(--ui-danger-subtle);
  border-radius: 0.25rem;
  padding: 0.75rem 1rem;
}

.embed-error code {
  background: var(--ui-bg);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.8em;
}

.embed-body {
  font-size: 0.95em;
}

.embed-body :deep(.note-embed) {
  margin: 0.5rem 0;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
