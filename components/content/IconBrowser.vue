<script setup lang="ts">
/**
 * IconBrowser - Interactive Lucide icon browser component
 * Browse and search available icons, click to copy name
 */

const searchQuery = ref('')
const copiedIcon = ref('')

// Comprehensive list of commonly used Lucide icons
const icons = [
  // Navigation & UI
  'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down', 'chevron-left', 'chevron-right', 
  'chevron-up', 'chevron-down', 'menu', 'x', 'search', 'filter', 'settings', 'sliders',
  'more-horizontal', 'more-vertical', 'grip-vertical', 'move', 'maximize', 'minimize',
  'expand', 'shrink', 'external-link', 'link', 'link-2', 'unlink', 'corner-up-left',
  
  // Actions
  'plus', 'minus', 'check', 'check-circle', 'x-circle', 'edit', 'edit-2', 'edit-3',
  'trash', 'trash-2', 'copy', 'clipboard', 'clipboard-check', 'save', 'download',
  'upload', 'upload-cloud', 'share', 'share-2', 'send', 'refresh-cw', 'rotate-cw',
  'undo', 'redo', 'repeat', 'shuffle', 'play', 'pause', 'stop', 'skip-forward', 'skip-back',
  
  // Files & Folders
  'file', 'file-text', 'file-code', 'file-json', 'file-image', 'file-video', 'file-audio',
  'file-archive', 'file-plus', 'file-minus', 'file-check', 'file-x', 'files', 'folder',
  'folder-open', 'folder-plus', 'folder-minus', 'folder-tree', 'archive', 'package',
  
  // Content
  'book', 'book-open', 'book-marked', 'bookmark', 'bookmarks', 'library', 'newspaper',
  'scroll', 'scroll-text', 'sticky-note', 'notebook', 'notebook-pen',
  'text', 'type', 'heading', 'heading-1', 'heading-2', 'heading-3', 'list', 'list-ordered',
  'list-todo', 'list-checks', 'align-left', 'align-center', 'align-right', 'align-justify',
  'quote', 'pilcrow', 'code', 'code-2', 'braces', 'brackets', 'hash', 'at-sign',
  
  // Communication
  'mail', 'mail-open', 'inbox', 'send', 'message-square', 'message-circle', 'messages-square',
  'phone', 'phone-call', 'video', 'mic', 'mic-off', 'volume', 'volume-1', 'volume-2', 'volume-x',
  'bell', 'bell-off', 'bell-ring', 'megaphone', 'rss',
  
  // Users & People
  'user', 'user-plus', 'user-minus', 'user-check', 'user-x', 'users', 'users-2',
  'contact', 'circle-user', 'person-standing', 'accessibility',
  
  // Media
  'image', 'image-plus', 'images', 'camera', 'camera-off', 'film', 'clapperboard',
  'music', 'music-2', 'music-3', 'music-4', 'headphones', 'speaker', 'radio', 'podcast',
  'tv', 'monitor', 'smartphone', 'tablet', 'laptop',
  
  // Data & Charts
  'bar-chart', 'bar-chart-2', 'bar-chart-3', 'bar-chart-4', 'line-chart', 'pie-chart',
  'trending-up', 'trending-down', 'activity', 'pulse',
  'table', 'table-2', 'kanban', 'layout-grid', 'layout-list', 'layout-dashboard',
  'database', 'server', 'hard-drive', 'cpu', 'circuit-board',
  
  // Development
  'git-branch', 'git-commit', 'git-merge', 'git-pull-request', 'git-fork',
  'terminal', 'terminal-square', 'command', 'keyboard',
  'bug', 'bug-off', 'test-tube', 'test-tubes', 'flask-conical',
  'binary', 'variable', 'webhook',
  
  // Status & Alerts
  'info', 'circle-help', 'help-circle', 'alert-circle', 'alert-triangle', 'alert-octagon',
  'shield', 'shield-check', 'shield-alert', 'shield-x', 'lock', 'lock-open', 'unlock',
  'key', 'key-round', 'fingerprint', 'scan', 'eye', 'eye-off',
  
  // Weather & Nature
  'sun', 'moon', 'star', 'stars', 'cloud', 'cloud-rain', 'cloud-snow', 'cloud-lightning',
  'wind', 'droplet', 'droplets', 'flame', 'thermometer', 'umbrella', 'rainbow',
  'leaf', 'tree-deciduous', 'tree-pine', 'flower', 'flower-2', 'sprout', 'clover',
  
  // Objects
  'home', 'building', 'building-2', 'castle', 'landmark', 'store', 'warehouse',
  'box', 'boxes', 'gift', 'shopping-bag', 'shopping-cart', 'credit-card', 'wallet',
  'banknote', 'coins', 'piggy-bank', 'receipt', 'ticket', 'tag', 'tags',
  'calendar', 'calendar-days', 'calendar-check', 'calendar-plus', 'calendar-x', 'clock',
  'timer', 'alarm-clock', 'hourglass', 'watch', 'stopwatch',
  'map', 'map-pin', 'map-pinned', 'navigation', 'compass', 'globe', 'globe-2',
  'flag', 'flag-triangle-right', 'milestone', 'signpost', 'route',
  'lightbulb', 'lamp', 'lamp-desk', 'flashlight',
  'rocket', 'plane', 'car', 'bus', 'train', 'bike', 'ship', 'anchor',
  'graduation-cap', 'school', 'award', 'trophy', 'medal', 'crown', 'gem',
  'heart', 'heart-handshake', 'thumbs-up', 'thumbs-down', 'hand',
  'smile', 'frown', 'meh', 'laugh', 'party-popper', 'sparkles', 'zap',
  
  // Tools
  'wrench', 'hammer', 'screwdriver', 'scissors', 'ruler', 'pencil', 'pen', 'pen-tool',
  'eraser', 'paintbrush', 'palette', 'pipette', 'crop',
  'printer', 'scan-line', 'scanner', 'projector', 'presentation',
  
  // AI & Brain
  'brain', 'brain-circuit', 'bot', 'cpu', 'sparkles', 'wand', 'wand-2',
]

const filteredIcons = computed(() => {
  if (!searchQuery.value) return icons
  const query = searchQuery.value.toLowerCase()
  return icons.filter(name => name.includes(query))
})

async function copyIconName(name: string) {
  const fullName = `i-lucide-${name}`
  try {
    await navigator.clipboard.writeText(fullName)
    copiedIcon.value = name
    setTimeout(() => {
      copiedIcon.value = ''
    }, 1500)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div class="icon-browser">
    <UInput
      v-model="searchQuery"
      placeholder="Search icons..."
      icon="i-lucide-search"
      size="lg"
      class="mb-4 w-full"
      :ui="{ root: 'w-full' }"
    />
    
    <p class="text-sm text-muted mb-4">
      Showing {{ filteredIcons.length }} of {{ icons.length }} icons. Click to copy.
    </p>
    
    <div class="icon-grid">
      <button
        v-for="name in filteredIcons"
        :key="name"
        class="icon-item"
        :class="{ copied: copiedIcon === name }"
        :title="`Click to copy: i-lucide-${name}`"
        @click="copyIconName(name)"
      >
        <UIcon :name="`i-lucide-${name}`" class="icon-display" />
        <span class="icon-name">{{ name }}</span>
        <span v-if="copiedIcon === name" class="copied-badge">Copied!</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.icon-browser {
  margin: 1rem 0;
}

.icon-browser :deep(input) {
  width: 100% !important;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 0.75rem;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0.5rem;
  border: 1px solid var(--ui-border-muted);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--ui-bg);
  position: relative;
}

.icon-item:hover {
  border-color: var(--color-violet-500);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .icon-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.icon-item.copied {
  border-color: var(--color-green-500);
  background: var(--ui-bg-elevated);
}

.icon-display {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.icon-name {
  font-size: 0.7rem;
  color: var(--ui-text-muted);
  text-align: center;
  word-break: break-all;
  line-height: 1.2;
}

.copied-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 0.6rem;
  background: var(--color-green-500);
  color: white;
  padding: 2px 4px;
  border-radius: 4px;
}
</style>
