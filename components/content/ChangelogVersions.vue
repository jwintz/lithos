<script setup lang="ts">
/**
 * ChangelogVersions Component
 * 
 * Custom changelog display component that avoids layout issues with Nuxt UI's
 * UChangelogVersions on narrow viewports.
 */

interface Version {
  title: string
  date?: string
  description?: string
  to?: string
}

const props = defineProps<{
  versions: Version[]
}>()

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return dateStr
  }
}
</script>

<template>
  <div class="changelog-versions my-8">
    <div class="relative">
      <!-- Timeline line -->
      <div class="absolute left-[7px] top-3 bottom-3 w-px bg-[var(--ui-border)]" />
      
      <!-- Version entries -->
      <div class="space-y-8">
        <article 
          v-for="(version, index) in versions" 
          :key="index"
          class="relative pl-8"
        >
          <!-- Dot indicator -->
          <div class="absolute left-0 top-1.5 size-4 rounded-full bg-[var(--ui-bg)] ring ring-[var(--ui-border)] flex items-center justify-center">
            <div class="size-2 rounded-full bg-[var(--ui-primary)]" />
          </div>
          
          <!-- Content -->
          <div>
            <!-- Title row with date -->
            <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <component
                :is="version.to ? 'a' : 'span'"
                :href="version.to"
                :target="version.to ? '_blank' : undefined"
                class="text-xl font-semibold text-[var(--ui-text-highlighted)]"
                :class="{ 'hover:text-[var(--ui-primary)] transition-colors': version.to }"
              >
                {{ version.title }}
              </component>
              <time 
                v-if="version.date" 
                :datetime="version.date"
                class="text-sm text-[var(--ui-text-muted)]"
              >
                {{ formatDate(version.date) }}
              </time>
            </div>
            
            <!-- Description -->
            <p v-if="version.description" class="mt-1 text-[var(--ui-text-muted)]">
              {{ version.description }}
            </p>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>
