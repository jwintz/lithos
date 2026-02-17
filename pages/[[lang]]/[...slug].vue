<script setup lang="ts">
/**
 * Custom Docs Page
 *
 * Extends Docus page with Obsidian features:
 * - PropertiesPanel at top of content
 * - Backlinks at bottom
 * - Local graph in sidebar
 * - Special treatment for daily notes (date header, prev/next navigation)
 */
import { kebabCase } from 'scule'
import type { ContentNavigationItem, Collections, DocsCollectionItem } from '@nuxt/content'
import { findPageHeadline } from '@nuxt/content/utils'
import { sortNavigationItems } from '~/composables/useNavSorting'

definePageMeta({
  layout: 'docs',
})

const route = useRoute()
const { locale, isEnabled, t } = useDocusI18n()
const appConfig = useAppConfig()
const navigation = inject<Ref<ContentNavigationItem[]>>('navigation')
const runtimeConfig = useRuntimeConfig()

// Normalize path: strip trailing slash to ensure SSR/client key parity.
// Static hosts (GitHub Pages, GitLab Pages) redirect /path to /path/,
// causing route.path to differ between SSR and client hydration.
// We also strip the baseURL for content querying if it's set.
const normalizedPath = computed(() => {
  const baseURL = runtimeConfig.app.baseURL || '/'
  let p = route.path
  
  // Strip baseURL from path for content querying
  if (baseURL !== '/') {
    const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL
    if (p.startsWith(cleanBase)) {
      p = p.slice(cleanBase.length)
    }
  }
  
  // Ensure path starts with / and has no trailing slash (unless it's just /)
  if (!p.startsWith('/')) p = '/' + p
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  
  return p
})

const collectionName = computed(() => isEnabled.value ? `docs_${locale.value}` : 'docs')

const [{ data: page }] = await Promise.all([
  useAsyncData(kebabCase(normalizedPath.value), () => queryCollection(collectionName.value as keyof Collections).path(normalizedPath.value).first() as Promise<DocsCollectionItem>),
    // Surround fetched client-side from navigation to respect custom sorting
])

// Compute sorted navigation using shared composable
// Ensures surround links use exact same order as sidebar
const sortedNavigation = computed(() => {
  if (!navigation?.value) return []
  return sortNavigationItems(navigation.value)
})

// Calculate Surround Paths from sorted tree
const surroundPaths = computed(() => {
  if (!sortedNavigation.value || !page.value) return null

  const flat: ContentNavigationItem[] = []
  const traverse = (items: ContentNavigationItem[]) => {
    for (const item of items) {
      // Only include 'leaf' nodes (pages), skipping folders
      if (!item.children?.length && item.path) {
        flat.push(item)
      }
      if (item.children) traverse(item.children)
    }
  }
  traverse(sortedNavigation.value)

  const idx = flat.findIndex(i => i.path === (page.value as any).path)
  if (idx === -1) return null

  return {
    prev: idx > 0 ? flat[idx - 1].path : null,
    next: idx < flat.length - 1 ? flat[idx + 1].path : null
  }
})

// Fetch full data for surround items (to get descriptions for better presentation)
const { data: surround } = await useAsyncData(
  `${kebabCase(normalizedPath.value)}-surround-resolved`,
  async () => {
    if (!surroundPaths.value) return null
    
    const { prev, next } = surroundPaths.value
    const paths = [prev, next].filter(Boolean) as string[]
    
    if (paths.length === 0) return null

    // Fetch full items
    const items = await queryCollection(collectionName.value as keyof Collections)
      .where('path', 'IN', paths)
      .select('title', 'description', 'path', 'navigation')
      .all()
      
    // Map back to [prev, next] slots
    const getMatch = (path: string | null) => path ? items.find(i => i.path === path) || null : null
    
    return [getMatch(prev), getMatch(next)]
  },
  { watch: [surroundPaths] }
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

// Check if this is a daily note
const isDailyNote = computed(() => {
  return (page.value as any)?.isDailyNote === true || (page.value as any)?.type === 'daily-note'
})

// Check if this is a Base file
const isBaseFile = computed(() => {
  const p = page.value as any
  const ext = p?.extension
  const originalExt = p?._originalExtension || p?.meta?._originalExtension
  const file = p?._file || p?.meta?._file
  // Check original extension (set by obsidian-bases module), current extension, or file path
  return String(originalExt) === '.base' || String(ext) === 'base' || file?.endsWith('.base')
})

// Daily note navigation (prev/next by date)
const { data: dailyNoteSurround } = await useAsyncData(
  `daily-note-surround-${kebabCase(normalizedPath.value)}`,
  async () => {
    if (!isDailyNote.value) return null

    const allNotes = await queryCollection(collectionName.value as keyof Collections)
      .where('isDailyNote', '==', true)
      .order('date', 'DESC')
      .all()

    const currentIndex = allNotes.findIndex((n: any) => n.path === page.value?.path)
    if (currentIndex === -1) return null

    return {
      prev: currentIndex < allNotes.length - 1 ? allNotes[currentIndex + 1] : null,
      next: currentIndex > 0 ? allNotes[currentIndex - 1] : null
    }
  },
  { watch: [isDailyNote] }
)

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description

useSeoMeta({
  title,
  ogTitle: title,
  description,
  ogDescription: description,
})

const headline = ref(findPageHeadline(navigation?.value, page.value?.path))
watch(() => navigation?.value, () => {
  headline.value = findPageHeadline(navigation?.value, page.value?.path) || headline.value
})

defineOgImageComponent('Docs', {
  headline: headline.value,
})

const github = computed(() => appConfig.github ? appConfig.github : null)

const editLink = computed(() => {
  if (!github.value) {
    return
  }

  return [
    github.value.url,
    'edit',
    github.value.branch,
    github.value.rootDir,
    'content',
    (page.value as any)?.stem && (page.value as any)?.extension 
      ? `${page.value.stem}.${page.value.extension}` 
      : 'index.md',
  ].filter(Boolean).join('/')
})

// Extract frontmatter for PropertiesPanel (exclude internal fields)
const frontmatter = computed(() => {
  if (!page.value) return {}

  const data: Record<string, any> = {}
  const pageData = page.value as any

  // Internal keys to exclude
  const internalKeys = new Set([
    'body', 'excerpt', 'path', 'stem', 'extension', 'seo', 'head',
    'navigation', '_id', '__hash__', 'id', 'links', 'title', 'description',
    'isDailyNote', 'type', 'date', 'year', 'month', 'day', 'displayDate'
  ])

  // Copy non-internal keys
  for (const [key, value] of Object.entries(pageData)) {
    if (!key.startsWith('_') && !internalKeys.has(key)) {
      // Flatten meta object if present
      if (key === 'meta' && typeof value === 'object' && value !== null) {
        for (const [metaKey, metaValue] of Object.entries(value)) {
          if (!internalKeys.has(metaKey)) {
            data[metaKey] = metaValue
          }
        }
      } else {
        data[key] = value
      }
    }
  }

  return data
})

// Check if properties should be shown
const showProperties = computed(() => {
  return Object.keys(frontmatter.value).length > 0
})

// ----------------------------------------------------------------
// Source View Implementation
// ----------------------------------------------------------------
const showSource = ref(false)
const rawContent = ref('')
const isLoadingSource = ref(false)

async function toggleSourceView() {
  if (showSource.value) {
    showSource.value = false
    return
  }

  // Optimize: Switch immediately if we already have content
  if (rawContent.value) {
    showSource.value = true
    return
  }

  // Fetch raw content
  isLoadingSource.value = true
  try {
    let filePath = page.value._file || page.value.id || ''
    
    // Clean path for fetching - remove common prefixes
    filePath = filePath
      .replace(/^docs\//, '')
      .replace(/^content\//, '')
      .replace(/^\//, '')
    
    // Ensure .md extension
    if (!filePath.endsWith('.md') && !filePath.includes('.')) {
      filePath = filePath + '.md'
    }

    let content: string | null = null

    // Try multiple fetch strategies
    const fetchStrategies = [
      // Strategy 1: Dynamic API (dev server)
      async () => {
        const result = await $fetch<{ content: string }>('/api/raw', {
          params: { path: filePath }
        })
        return result.content
      },
      // Strategy 2: Static /_raw/ path with original filename
      async () => {
        const result = await $fetch(`/_raw/${filePath}`, { 
          parseResponse: (txt: string) => txt 
        })
        return typeof result === 'string' ? result : null
      },
      // Strategy 3: Try with index.md for directory-like paths
      async () => {
        if (filePath.endsWith('.md') && !filePath.endsWith('index.md')) {
          const dirPath = filePath.replace(/\.md$/, '/index.md')
          const result = await $fetch(`/_raw/${dirPath}`, {
            parseResponse: (txt: string) => txt
          })
          return typeof result === 'string' ? result : null
        }
        return null
      }
    ]

    for (const strategy of fetchStrategies) {
      try {
        const result = await strategy()
        if (result) {
          content = result
          break
        }
      } catch (e) {
        // Continue to next strategy
      }
    }

    if (content) {
      rawContent.value = content
      showSource.value = true
    } else {
      console.error('Failed to fetch raw content from all sources')
    }
  } catch (e) {
    console.error('Failed to fetch raw content:', e)
  } finally {
    isLoadingSource.value = false
  }
}


// Format date for daily notes
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Daily notes folder route
const dailyNotesRoute = computed(() => runtimeConfig.public.dailyNotesRoute || '/daily-notes')

// Auto-scroll ToC and Force Indicator Update
onMounted(async () => {
  // Force TOC to re-calculate headings after mount
  // ContentToc listens to 'page:loading:end' to set --indicator-size
  await nextTick()
  useNuxtApp().callHook('page:loading:end')

  // Watch for changes to the active ToC link
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target as HTMLElement
        if (target.classList.contains('text-primary') && target.closest('aside[data-slot="root"]')) {
          // Scroll the active link into view within the ToC container
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }
    }
  })

  // Observe the right aside (UPageAside) - it's the aside in the order-last column
  const rightAside = document.querySelector('.order-last aside[data-slot="root"], aside[data-slot="root"]:last-of-type')
  if (rightAside) {
    observer.observe(rightAside, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    })
  }

  // Cleanup on unmount
  onUnmounted(() => {
    observer.disconnect()
  })
})

</script>

<template>
  <UPage v-if="page">
    <UPageHeader
      v-if="!isBaseFile && !isDailyNote"
      :title="page.title"
      :description="page.description"
      :headline="headline"
      :ui="{
        wrapper: 'flex-row items-center flex-wrap justify-between',
      }"
    >
      <template #links>
        <UButton
          variant="soft"
          color="neutral"
          size="sm"
          :icon="showSource ? 'i-lucide-file-text' : 'i-lucide-code'"
          :loading="isLoadingSource"
          @click="toggleSourceView"
          :label="showSource ? 'View Rendered' : 'View Source'"
        />
        <DocsPageHeaderLinks />
      </template>
    </UPageHeader>

    <!-- Simplified header for base files (title only, no description/headline, no border) -->
    <UPageHeader
      v-else-if="isBaseFile"
      :title="page.title"
      :ui="{
        wrapper: 'flex-row items-center flex-wrap justify-between border-0',
        root: 'border-0',
        title: 'text-2xl font-bold',
      }"
    >
      <template #links>
        <UButton
          variant="soft"
          color="neutral"
          size="sm"
          :icon="showSource ? 'i-lucide-file-text' : 'i-lucide-code'"
          :loading="isLoadingSource"
          @click="toggleSourceView"
          :label="showSource ? 'View Rendered' : 'View Source'"
        />
        <DocsPageHeaderLinks />
      </template>
    </UPageHeader>

    <!-- Daily note header -->
    <UPageHeader
      v-else-if="isDailyNote"
      :title="page.title"
      :ui="{
        wrapper: 'flex-row items-center flex-wrap justify-between',
      }"
    >
      <!-- Daily note header with date -->
      <template v-if="isDailyNote" #headline>
        <div class="flex items-center gap-2 text-sm text-muted">
          <UIcon name="i-lucide-calendar" class="w-4 h-4" />
          <time :datetime="(page as any).date">
            {{ formatDate((page as any).date) }}
          </time>
        </div>
      </template>

      <template #links>
        <!-- Tags for daily notes -->
        <div v-if="isDailyNote && (page as any).tags?.length" class="flex flex-wrap gap-1 mr-4">
          <UBadge
            v-for="tag in (page as any).tags"
            :key="tag"
            variant="subtle"
            size="sm"
          >
            {{ tag }}
          </UBadge>
        </div>

        <UButton
          variant="soft"
          color="neutral"
          size="sm"
          :icon="showSource ? 'i-lucide-file-text' : 'i-lucide-code'"
          :loading="isLoadingSource"
          @click="toggleSourceView"
          :label="showSource ? 'View Rendered' : 'View Source'"
        />

        <DocsPageHeaderLinks />
      </template>
    </UPageHeader>

    <UPageBody>
      <article>
        <!-- Properties Panel (Obsidian-style) -->
        <PropertiesPanel
          v-if="showProperties"
          :frontmatter="frontmatter"
          :collapsed="true"
        />

        <ContentRenderer
          v-if="page && !showSource"
          :value="page"
        />
      </article>

      <!-- Source View - Monaco Editor (externalized for SSG, loaded client-side) -->
      <div v-if="showSource" class="source-view-container mt-4 mb-8">
        <MonacoEditor
          v-model="rawContent"
          language="markdown"
          :read-only="true"
        />
      </div>

      <!-- Daily note navigation -->
      <nav
        v-if="isDailyNote && dailyNoteSurround && (dailyNoteSurround.prev || dailyNoteSurround.next)"
        class="flex justify-between gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800"
      >
        <UButton
          v-if="dailyNoteSurround.prev"
          :to="dailyNoteSurround.prev.path"
          variant="ghost"
          color="neutral"
          class="flex-1 max-w-xs justify-start"
        >
          <template #leading>
            <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          </template>
          <div class="text-left">
            <div class="text-xs text-muted">Previous</div>
            <div class="font-medium truncate">{{ dailyNoteSurround.prev.title }}</div>
          </div>
        </UButton>
        <div v-else class="flex-1" />

        <UButton
          v-if="dailyNoteSurround.next"
          :to="dailyNoteSurround.next.path"
          variant="ghost"
          color="neutral"
          class="flex-1 max-w-xs justify-end"
        >
          <div class="text-right">
            <div class="text-xs text-muted">Next</div>
            <div class="font-medium truncate">{{ dailyNoteSurround.next.title }}</div>
          </div>
          <template #trailing>
            <UIcon name="i-lucide-arrow-right" class="w-4 h-4" />
          </template>
        </UButton>
        <div v-else class="flex-1" />
      </nav>

      <!-- Backlinks (Obsidian-style Linked References) -->
      <BacklinksList :path="page.path" />

      <!-- Mobile/Tablet Graph Button (hidden - graph accessible via header button) -->
      <!-- Graph modal is opened via GlobalGraphModal component which listens for lithos:open-graph-modal event -->

      <!-- Standard doc navigation (not for daily notes) -->
      <template v-if="!isDailyNote">
        <USeparator>
          <div
            v-if="github"
            class="flex items-center gap-2 text-sm text-muted"
          >
            <UButton
              variant="link"
              color="neutral"
              :to="editLink"
              target="_blank"
              icon="i-lucide-pen"
              :ui="{ leadingIcon: 'size-4' }"
            >
              {{ t('docs.edit') }}
            </UButton>
            <span>{{ t('common.or') }}</span>
            <UButton
              variant="link"
              color="neutral"
              :to="`${github.url}/issues/new/choose`"
              target="_blank"
              icon="i-lucide-alert-circle"
              :ui="{ leadingIcon: 'size-4' }"
            >
              {{ t('docs.report') }}
            </UButton>
          </div>
        </USeparator>
        
        <ClientOnly>
          <UContentSurround :surround="surround" />
        </ClientOnly>
      </template>
    </UPageBody>

    <template #right>
      <UPageAside>
        <!-- Local Graph (Obsidian-style mini graph) -->
        <LocalGraph :path="page.path" :depth="2" class="mb-4" />

        <!-- Table of Contents -->
        <!-- Standard Docus TOC component -->
        <ClientOnly v-if="page?.body?.toc?.links?.length">
          <UContentToc
            highlight
            :title="appConfig.toc?.title || t('docs.toc')"
            :links="page.body?.toc?.links"
          >
            <template #bottom>
              <DocsAsideRightBottom />
              <ReadingStats v-if="page?.body" :body="page.body" :path="page.path || ''" />
            </template>
          </UContentToc>
        </ClientOnly>

        <!-- Reading stats fallback when no ToC -->
        <ReadingStats v-else-if="page?.body" :body="page.body" :path="page.path || ''" />
      </UPageAside>
    </template>
  </UPage>
  
  <!-- Global graph modal for header button on tablet/mobile -->
  <GlobalGraphModal />
</template>

<style scoped>
/* Right aside - let UPageAside handle sticky/scroll behavior via its theme */
/* Only add layout helpers if needed */

/* Source view container - must contain Monaco absolutely positioned elements */
.source-view-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 400px;
  border-radius: 0.5rem;
}
</style>
