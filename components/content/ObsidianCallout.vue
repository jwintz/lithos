<script setup lang="ts">
/**
 * ObsidianCallout Component
 *
 * Renders Obsidian-style callouts transformed from:
 * > [!type] Title
 * > Content
 *
 * Into MDC: ::obsidian-callout{type="warning"}
 */

const props = defineProps<{
  type?: string  // Obsidian callout type: note, tip, warning, caution, abstract, info, todo, etc.
  collapsed?: boolean
}>()

defineSlots<{
  title?: () => any
  default?: () => any
}>()

// Icon mapping based on type (using Nuxt Icon format: lucide:icon-name)
const iconMap: Record<string, string> = {
  note: 'lucide:info',
  tip: 'lucide:lightbulb',
  warning: 'lucide:triangle-alert',
  caution: 'lucide:circle-alert',
  abstract: 'lucide:clipboard-list',
  summary: 'lucide:clipboard-list',
  tldr: 'lucide:clipboard-list',
  info: 'lucide:info',
  todo: 'lucide:circle-check',
  success: 'lucide:check',
  check: 'lucide:check',
  done: 'lucide:check',
  question: 'lucide:help-circle',
  help: 'lucide:help-circle',
  faq: 'lucide:help-circle',
  failure: 'lucide:x',
  fail: 'lucide:x',
  missing: 'lucide:x',
  danger: 'lucide:zap',
  error: 'lucide:zap',
  bug: 'lucide:bug',
  example: 'lucide:list',
  quote: 'lucide:quote',
  cite: 'lucide:quote'
}

const icon = computed(() => iconMap[props.type || 'note'] || 'lucide:info')

// Control collapse state
const isOpen = ref(!props.collapsed)
</script>

<template>
  <div
    class="obsidian-callout"
    :class="[`obsidian-callout-${type || 'note'}`, { 'obsidian-callout-collapsed': !isOpen }]"
  >
    <div class="obsidian-callout-header" @click="isOpen = !isOpen">
      <span class="obsidian-callout-icon">
        <UIcon :name="icon" class="size-5" />
      </span>
      <span class="obsidian-callout-title">
        <slot name="title">{{ (type || 'note').charAt(0).toUpperCase() + (type || 'note').slice(1) }}</slot>
      </span>
      <span class="obsidian-callout-toggle">
        <UIcon name="lucide:chevron-down" :class="['size-4', { 'rotate-180': isOpen }]" />
      </span>
    </div>

    <Transition name="obsidian-callout-expand">
      <div v-show="isOpen" class="obsidian-callout-content">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.obsidian-callout {
  margin: 1rem 0;
  border-radius: 0.5rem;
  border-left: 4px solid;
  background: var(--ui-bg-muted);
  overflow: hidden;
}

/* Type-specific colors */
.obsidian-callout-note {
  border-color: var(--ui-primary);
}
.obsidian-callout-note .obsidian-callout-icon {
  color: var(--ui-primary);
}

.obsidian-callout-tip {
  border-color: var(--ui-success);
}
.obsidian-callout-tip .obsidian-callout-icon {
  color: var(--ui-success);
}

.obsidian-callout-warning {
  border-color: var(--ui-warning);
}
.obsidian-callout-warning .obsidian-callout-icon {
  color: var(--ui-warning);
}

.obsidian-callout-caution {
  border-color: var(--ui-error);
}
.obsidian-callout-caution .obsidian-callout-icon {
  color: var(--ui-error);
}

.obsidian-callout-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
}

.obsidian-callout-header:hover {
  background: var(--ui-bg-elevated);
}

.obsidian-callout-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.obsidian-callout-title {
  flex: 1;
}

.obsidian-callout-toggle {
  color: var(--ui-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.obsidian-callout-toggle .rotate-180 {
  transition: transform 0.2s ease;
  transform: rotate(180deg);
}

.obsidian-callout-content {
  padding: 0 1rem 1rem 1rem;
}

.obsidian-callout-content :deep(p:first-child) {
  margin-top: 0;
}

.obsidian-callout-content :deep(p:last-child) {
  margin-bottom: 0;
}

/* Collapse animation */
.obsidian-callout-expand-enter-active,
.obsidian-callout-expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.obsidian-callout-expand-enter-from,
.obsidian-callout-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
