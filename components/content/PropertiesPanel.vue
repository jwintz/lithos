<script setup lang="ts">
/**
 * PropertiesPanel Component
 *
 * Displays YAML frontmatter as a collapsible "Properties" panel,
 * similar to Obsidian's Properties view.
 *
 * Design principles:
 * - Compact, space-efficient layout
 * - Type-aware typography (monospace for numbers, icons for booleans)
 * - Subtle separators that don't dominate
 * - Refined micro-interactions
 */

const props = defineProps<{
  frontmatter: Record<string, any>
  collapsed?: boolean
}>()

// Check if a value is "empty" and should be filtered out
function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string' && value.trim() === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  if (typeof value === 'object' && Object.keys(value).length === 0) return true
  return false
}

// Filter and prepare properties for display
const displayProperties = computed(() => {
  if (!props.frontmatter) return []

  const entries: Array<{ key: string; label: string; value: any; type: string }> = []

  for (const [key, value] of Object.entries(props.frontmatter)) {
    if (key.startsWith('_') || isInternalKey(key)) continue
    
    // Skip empty/non-existent values
    if (isEmptyValue(value)) continue

    // Flatten meta object
    if (key === 'meta' && typeof value === 'object' && value !== null) {
      for (const [metaKey, metaValue] of Object.entries(value)) {
        if (!isInternalKey(metaKey) && !isEmptyValue(metaValue)) {
          entries.push({
            key: metaKey,
            label: formatLabel(metaKey),
            value: metaValue,
            type: inferType(metaKey, metaValue)
          })
        }
      }
    } else {
      entries.push({
        key,
        label: formatLabel(key),
        value,
        type: inferType(key, value)
      })
    }
  }

  return entries
})

// Keys to exclude from display (Nuxt Content internal + common meta)
function isInternalKey(key: string): boolean {
  const internalKeys = [
    'body', 'excerpt', 'dir', 'path', 'extension', 'stem',
    'navigation', 'seo', 'head', 'layout', 'title', 'description',
    'mtime', 'surround', 'draft', 'toc', 'id', '_id', '_file', '_extension', '_draft', '_partial', '_locale'
  ]
  return internalKeys.includes(key)
}

// Format key as human-readable label
function formatLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')  // camelCase to spaces
    .replace(/[-_]/g, ' ')        // kebab/snake to spaces
    .replace(/^\w/, c => c.toUpperCase())  // Capitalize first letter
    .trim()
}

// Infer the type of value for appropriate rendering
function inferType(key: string, value: any): string {
  // Key-based inference first (more accurate)
  const keyLower = key.toLowerCase()
  if (keyLower === 'icon' || keyLower.endsWith('icon')) return 'icon'
  if (keyLower === 'order' || keyLower === 'priority' || keyLower === 'weight') return 'number'
  
  if (value === null || value === undefined) return 'empty'
  if (typeof value === 'boolean') return 'checkbox'
  if (typeof value === 'number') return 'number'
  if (value instanceof Date) return 'date'
  if (Array.isArray(value)) return 'tags'
  if (typeof value === 'string') {
    // Check for wikilink format [[...]]
    if (value.match(/^\[\[.+\]\]$/)) return 'wikilink'
    // Check for HTML anchor (wikilink transformed to anchor by MDC)
    if (value.match(/^<a\s+href=/i)) return 'html-link'
    if (value.match(/^https?:\/\//)) return 'url'
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'date'
    if (value.match(/^#[a-fA-F0-9]{6}$/)) return 'color'
    // Check for icon identifiers
    if (value.match(/^i-[a-z]+-[a-z-]+$/)) return 'icon'
  }
  if (typeof value === 'object') return 'object'
  return 'text'
}

// Extract wikilink target
function extractWikilink(value: string): { target: string; display: string } {
  const match = value.match(/^\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/)
  if (match) {
    return {
      target: match[1],
      display: match[2] || match[1]
    }
  }
  return { target: value, display: value }
}

// Extract link info from HTML anchor tag (transformed wikilink)
// Note: The value may be truncated by content schema, so handle partial matches
function extractHtmlLink(value: string): { href: string; text: string } {
  // Parse: <a href="/path" class="...">Display Text</a>
  const hrefMatch = value.match(/href="([^"]+)"/)
  const textMatch = value.match(/>([^<]+)<\/a>/)

  // If we can extract href, use it
  if (hrefMatch?.[1]) {
    const href = hrefMatch[1]
    const text = textMatch?.[1] || href.split('/').filter(Boolean).pop() || 'Link'
    return { href, text }
  }

  // Truncated value - try to provide something useful
  // The value might be truncated (e.g., "<a href=")
  return {
    href: '#',
    text: '(truncated link)'
  }
}

// Format date for display
function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Collapse state — use prop directly for SSR/hydration consistency,
// then track user toggles via ref after first interaction
const userToggled = ref(false)
const userOpen = ref(!props.collapsed)

function onToggle(event: Event) {
  userToggled.value = true
  userOpen.value = (event.target as HTMLDetailsElement).open
}

const isOpen = computed(() => userToggled.value ? userOpen.value : !props.collapsed)
</script>

<template>
  <details
    v-if="displayProperties.length > 0"
    class="properties-panel"
    :open="isOpen"
    @toggle="onToggle"
  >
    <summary class="properties-header">
      <span class="properties-icon">
        <Icon name="heroicons:cog-6-tooth" size="14" />
      </span>
      <span class="properties-title">Properties</span>
      <span class="properties-count">{{ displayProperties.length }}</span>
      <span class="properties-chevron">
        <Icon name="heroicons:chevron-down" size="12" />
      </span>
    </summary>

    <div class="properties-content">
      <div
        v-for="(prop, index) in displayProperties"
        :key="prop.key"
        class="property-row"
        :class="{ 'first-row': index === 0 }"
      >
        <span class="property-key">{{ prop.label }}</span>
        <span class="property-value" :class="`type-${prop.type}`">
          <!-- Empty value -->
          <template v-if="prop.type === 'empty'">
            <span class="empty-value">--</span>
          </template>

          <!-- Checkbox / Boolean -->
          <template v-else-if="prop.type === 'checkbox'">
            <span class="bool-value" :class="{ 'is-true': prop.value }">
              <Icon
                :name="prop.value ? 'heroicons:check-circle-solid' : 'heroicons:x-circle'"
                size="16"
              />
              <span>{{ prop.value ? 'Yes' : 'No' }}</span>
            </span>
          </template>

          <!-- Icon identifier -->
          <template v-else-if="prop.type === 'icon'">
            <span class="icon-value">
              <Icon :name="prop.value" size="16" class="icon-preview" />
              <code>{{ prop.value }}</code>
            </span>
          </template>

          <!-- Number -->
          <template v-else-if="prop.type === 'number'">
            <code class="number-value">{{ prop.value }}</code>
          </template>

          <!-- Tags array -->
          <template v-else-if="prop.type === 'tags'">
            <span class="tags-wrapper">
              <UBadge
                v-for="tag in prop.value"
                :key="tag"
                color="neutral"
                variant="subtle"
                size="sm"
                class="font-mono"
              >
                #{{ tag }}
              </UBadge>
            </span>
          </template>

          <!-- Wikilink -->
          <template v-else-if="prop.type === 'wikilink'">
            <NuxtLink
              :to="`/${extractWikilink(prop.value).target.toLowerCase().replace(/\s+/g, '-')}`"
              class="wikilink"
            >
              {{ extractWikilink(prop.value).display }}
            </NuxtLink>
          </template>

          <!-- HTML Link (wikilink transformed to anchor by MDC) -->
          <template v-else-if="prop.type === 'html-link'">
            <NuxtLink
              :to="extractHtmlLink(prop.value).href"
              class="wikilink"
            >
              {{ extractHtmlLink(prop.value).text }}
            </NuxtLink>
          </template>

          <!-- URL -->
          <template v-else-if="prop.type === 'url'">
            <a :href="prop.value" target="_blank" rel="noopener" class="url-link">
              <Icon name="heroicons:arrow-top-right-on-square" size="12" />
              <span>{{ prop.value.replace(/^https?:\/\//, '').slice(0, 35) }}</span>
              <span v-if="prop.value.length > 45" class="truncated">...</span>
            </a>
          </template>

          <!-- Date -->
          <template v-else-if="prop.type === 'date'">
            <span class="date-value">
              <Icon name="heroicons:calendar" size="14" />
              <time :datetime="prop.value">{{ formatDate(prop.value) }}</time>
            </span>
          </template>

          <!-- Color -->
          <template v-else-if="prop.type === 'color'">
            <span class="color-value">
              <span class="color-swatch" :style="{ backgroundColor: prop.value }"></span>
              <code>{{ prop.value }}</code>
            </span>
          </template>

          <!-- Object (flatten or show as JSON) -->
          <template v-else-if="prop.type === 'object'">
            <code class="object-value">{{ JSON.stringify(prop.value) }}</code>
          </template>

          <!-- Default text -->
          <template v-else>
            <span class="text-value">{{ prop.value }}</span>
          </template>
        </span>
      </div>
    </div>
  </details>
</template>

<style scoped>
.properties-panel {
  margin-bottom: 1.25rem;
  border-radius: 6px;
  border: 1px solid color-mix(in oklch, var(--ui-border) 60%, transparent);
  background: color-mix(in oklch, var(--ui-bg-muted) 50%, transparent);
  overflow: hidden;
  font-size: 0.8125rem;
}

.properties-header {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.625rem;
  font-family: var(--font-sans);
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-muted);
  background: transparent;
  cursor: pointer;
  user-select: none;
  transition: color 0.15s ease;
  list-style: none;
}

.properties-header::-webkit-details-marker {
  display: none;
}

.properties-header:hover {
  color: var(--ui-text-dimmed);
}

.properties-icon {
  display: flex;
  align-items: center;
  opacity: 0.7;
}

.properties-title {
  flex-shrink: 0;
}

.properties-count {
  font-size: 0.625rem;
  font-weight: 500;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  background: color-mix(in oklch, var(--ui-bg-elevated) 80%, transparent);
  color: var(--ui-text-muted);
  margin-left: 0.125rem;
}

.properties-chevron {
  margin-left: auto;
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  opacity: 0.5;
}

details[open] .properties-chevron {
  transform: rotate(180deg);
}

.properties-content {
  padding: 0 0.625rem 0.5rem;
}

.property-row {
  display: grid;
  grid-template-columns: minmax(60px, auto) 1fr;
  gap: 0.75rem;
  padding: 0.375rem 0;
  align-items: baseline;
  border-top: 1px solid color-mix(in oklch, var(--ui-border) 30%, transparent);
}

.property-row.first-row {
  border-top: none;
}

.property-key {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ui-text-muted);
  white-space: nowrap;
}

.property-value {
  font-family: var(--font-sans);
  color: var(--ui-text-highlighted);
  line-height: 1.4;
  min-width: 0;
}

/* Text values - default styling */
.text-value {
  color: var(--ui-text-highlighted);
}

/* Number values - monospace, subtle highlight */
.number-value {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-violet-500);
  background: color-mix(in oklch, var(--color-violet-500) 8%, transparent);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
}

.dark .number-value {
  color: var(--color-violet-400);
  background: color-mix(in oklch, var(--color-violet-400) 12%, transparent);
}

/* Icon values */
.icon-value {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.icon-preview {
  color: var(--color-violet-500);
}

.dark .icon-preview {
  color: var(--color-violet-400);
}

.icon-value code {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--ui-text-muted);
  background: color-mix(in oklch, var(--ui-bg-elevated) 60%, transparent);
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
}

/* Boolean values */
.bool-value {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.bool-value.is-true {
  color: var(--color-green-600);
}

.bool-value:not(.is-true) {
  color: var(--ui-text-muted);
}

.dark .bool-value.is-true {
  color: var(--color-green-400);
}

/* Tags */
.tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

/* Wikilink */
.wikilink {
  color: var(--color-violet-600);
  text-decoration: none;
  border-bottom: 1px dotted var(--color-violet-400);
  transition: border-color 0.15s ease;
}

.wikilink:hover {
  border-bottom-style: solid;
}

.dark .wikilink {
  color: var(--color-violet-400);
  border-bottom-color: var(--color-violet-500);
}

/* Malformed value */
.malformed-value {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-amber-600);
  font-size: 0.75rem;
  font-style: italic;
}

.dark .malformed-value {
  color: var(--color-amber-400);
}

/* URL */
.url-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-violet-600);
  text-decoration: none;
  font-size: 0.75rem;
  transition: color 0.15s ease;
}

.url-link:hover {
  color: var(--color-violet-700);
  text-decoration: underline;
}

.dark .url-link {
  color: var(--color-violet-400);
}

.dark .url-link:hover {
  color: var(--color-violet-300);
}

.truncated {
  color: var(--ui-text-muted);
}

/* Date */
.date-value {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ui-text-dimmed);
}

.date-value time {
  color: var(--ui-text-highlighted);
}

/* Color */
.color-value {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}

.color-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid color-mix(in oklch, var(--ui-border) 50%, transparent);
  flex-shrink: 0;
}

.color-value code {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--ui-text-muted);
}

/* Object */
.object-value {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  padding: 0.25rem 0.5rem;
  background: color-mix(in oklch, var(--ui-bg-elevated) 60%, transparent);
  border-radius: 4px;
  display: block;
  overflow-x: auto;
  max-width: 100%;
  color: var(--ui-text-muted);
}

/* Empty */
.empty-value {
  color: var(--ui-text-muted);
  opacity: 0.4;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
}
</style>
