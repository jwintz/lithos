<script setup lang="ts">
import { withBase } from 'ufo'

/**
 * ObsidianBase Component
 *
 * Renders filtered notes in various view formats:
 * - Table: Sortable data grid with frontmatter columns
 * - Cards: Card grid with cover images
 * - List: Simple list view
 *
 * Supports Obsidian Bases filter syntax:
 * - file.hasTag("tag")
 * - file.inFolder("Folder")
 * - file.hasLink("Note")
 * - property == value
 * - Combined with and/or/not
 */

interface BaseView {
  type: 'table' | 'cards' | 'list' | 'calendar'
  name: string
  sort?: { property: string; direction: 'ASC' | 'DESC' }[]
  columns?: string[]
  order?: string[]
  filters?: any
  limit?: number          // Max results to show
  groupBy?: string        // Property to group by
  image?: string          // e.g., "note.cover"
  imageFit?: string
  imageAspectRatio?: number
  cardSize?: number
}

interface PropertyConfig {
  type: string
  displayName?: string
  options?: string[]
}

interface BaseConfig {
  source?: string
  filters?: any
  views: BaseView[]
  properties?: Record<string, PropertyConfig>
  formulas?: any[]
}

const props = defineProps<{
  config?: string | BaseConfig
  configBase64?: string  // Base64 encoded JSON config
  source?: string
  filters?: any
  views?: BaseView[] | string  // Can be JSON string from MDC
  properties?: Record<string, PropertyConfig> | string  // Can be JSON string from MDC
  title?: string
  formulas?: any[] | string  // Can be JSON string from MDC
}>()

// Helper to parse JSON string props
function parseJsonProp<T>(value: any, fallback: T): T {
  if (!value) return fallback
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return fallback
    }
  }
  return value as T
}

// Helper to decode base64 on both server and client
function decodeBase64(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString('utf-8')
  }
  return atob(str)
}

// Build config from either full config prop or individual props
const baseConfig = computed<BaseConfig>(() => {
  // Try base64 encoded config first (preferred, avoids quote escaping issues)
  if (props.configBase64) {
    try {
      const decoded = decodeBase64(props.configBase64)
      return JSON.parse(decoded)
    } catch (e) {
      console.error('[ObsidianBase] Failed to decode base64 config:', e)
      // Fall through
    }
  }
  
  // Legacy: try config prop with quote replacement
  if (props.config) {
    if (typeof props.config === 'string') {
      try {
        return JSON.parse(props.config.replace(/'/g, '"'))
      } catch (e) {
        // Fall through
      }
    } else {
      return props.config
    }
  }
  return {
    source: props.source || '',
    filters: parseJsonProp(props.filters, {}),
    views: parseJsonProp(props.views, [{ type: 'table', name: 'Table' }]),
    properties: parseJsonProp(props.properties, {}),
    formulas: parseJsonProp(props.formulas, [])
  }
})

// Current active view
const activeView = ref(0)

// Color mode for noir effects
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// Interactive table column sorting (user-triggered)
const userSort = ref<{ column: string; direction: 'asc' | 'desc' } | null>(null)

// Toggle sort when clicking column header
function toggleColumnSort(column: string) {
  if (userSort.value?.column === column) {
    // Cycle: asc -> desc -> none
    if (userSort.value.direction === 'asc') {
      userSort.value = { column, direction: 'desc' }
    } else {
      userSort.value = null  // Clear sort
    }
  } else {
    userSort.value = { column, direction: 'asc' }
  }
}

// Get sort indicator for column header
function getSortIndicator(column: string): string {
  if (userSort.value?.column !== column) return ''
  return userSort.value.direction === 'asc' ? ' ↑' : ' ↓'
}

/**
 * Evaluate a filter expression against a document
 */
function evaluateFilter(filter: any, doc: any): boolean {
  if (!filter) return true
  
  // String filter - parse and evaluate
  if (typeof filter === 'string') {
    return evaluateExpression(filter, doc)
  }
  
  // Object filter with and/or/not
  if (typeof filter === 'object') {
    if (filter.and) {
      return filter.and.every((f: any) => evaluateFilter(f, doc))
    }
    if (filter.or) {
      return filter.or.some((f: any) => evaluateFilter(f, doc))
    }
    if (filter.not) {
      return filter.not.every((f: any) => !evaluateFilter(f, doc))
    }
    
    // Legacy format: { 'file.hasTag': 'value' }
    for (const [key, value] of Object.entries(filter)) {
      if (key === 'file.hasTag') {
        const tags = doc.tags || doc.meta?.tags || []
        const checkTags = Array.isArray(value) ? value : [value]
        if (!Array.isArray(tags) || !checkTags.some((t: string) => tags.includes(t))) return false
      } else if (key === 'file.inFolder') {
        if (!doc.path?.includes(String(value))) return false
      } else if (key === 'file.pathPattern') {
        const regex = new RegExp(String(value))
        if (!regex.test(doc.path || '')) return false
      }
    }
  }
  
  return true
}

/**
 * Evaluate a filter expression string
 * Supports Obsidian Bases filter syntax:
 * - file.hasTag("tag")
 * - file.inFolder("Folder")
 * - file.hasLink("Note")
 * - file.name.startsWith("prefix")
 * - file.name.endsWith("suffix")
 * - file.name.contains("substring")
 * - property == value (and other comparison operators)
 * - !expression (negation)
 */
function evaluateExpression(expr: string, doc: any): boolean {
  let trimmed = expr.trim()

  // Handle negation prefix: !expression or NOT expression
  let negate = false
  if (trimmed.startsWith('!')) {
    negate = true
    trimmed = trimmed.slice(1).trim()
  } else if (trimmed.toLowerCase().startsWith('not ')) {
    negate = true
    trimmed = trimmed.slice(4).trim()
  }

  const result = evaluatePositiveExpression(trimmed, doc)
  return negate ? !result : result
}

/**
 * Evaluate a positive (non-negated) filter expression
 */
function evaluatePositiveExpression(trimmed: string, doc: any): boolean {
  // file.hasTag("tag")
  const hasTagMatch = trimmed.match(/file\.hasTag\(["']([^"']+)["']\)/)
  if (hasTagMatch) {
    const tag = hasTagMatch[1]
    // Check both top-level and meta.tags (Nuxt Content v3 nests frontmatter in meta)
    const tags = doc.tags || doc.meta?.tags || []
    return Array.isArray(tags) && tags.includes(tag)
  }

  // file.inFolder("Folder")
  const inFolderMatch = trimmed.match(/file\.inFolder\(["']([^"']+)["']\)/)
  if (inFolderMatch) {
    const rawFolder = inFolderMatch[1].toLowerCase()
    // Normalize: remove leading/trailing slashes
    const folder = rawFolder.replace(/^\/+|\/+$/g, '')

    // Normalize doc path: remove leading slash
    const rawDocPath = (doc.path || '').toLowerCase()
    const docPath = rawDocPath.replace(/^\/+/, '')

    // Check if path contains the folder
    // e.g. docPath "projects/odin" starts with folder "projects"
    const isChild = docPath.startsWith(`${folder}/`)

    // Check if it IS the folder note
    // e.g. docPath "projects" IS folder "projects"
    // OR docPath "projects/index" IS folder index
    const isIndex = docPath === folder || docPath === `${folder}/index`

    return isChild && !isIndex
  }

  // file.hasLink("Note")
  const hasLinkMatch = trimmed.match(/file\.hasLink\(["']([^"']+)["']\)/)
  if (hasLinkMatch) {
    const link = hasLinkMatch[1].toLowerCase()
    const links = doc.links || []
    return links.some((l: any) =>
      (typeof l === 'string' ? l : l.href || l.to || '')
        .toLowerCase().includes(link)
    )
  }

  // file.name.startsWith("prefix") or file.basename.startsWith("prefix")
  const startsWithMatch = trimmed.match(/file\.(name|basename)\.startsWith\(["']([^"']+)["']\)/)
  if (startsWithMatch) {
    const prefix = startsWithMatch[2].toLowerCase()
    const filename = getFileName(doc).toLowerCase()
    return filename.startsWith(prefix)
  }

  // file.name.endsWith("suffix") or file.basename.endsWith("suffix")
  const endsWithMatch = trimmed.match(/file\.(name|basename)\.endsWith\(["']([^"']+)["']\)/)
  if (endsWithMatch) {
    const suffix = endsWithMatch[2].toLowerCase()
    const filename = getFileName(doc).toLowerCase()
    return filename.endsWith(suffix)
  }

  // file.name.contains("substring") or file.basename.contains("substring")
  const containsMatch = trimmed.match(/file\.(name|basename)\.contains\(["']([^"']+)["']\)/)
  if (containsMatch) {
    const substring = containsMatch[2].toLowerCase()
    const filename = getFileName(doc).toLowerCase()
    return filename.includes(substring)
  }

  // file.hasProperty("name") - check if property exists
  const hasPropertyMatch = trimmed.match(/file\.hasProperty\(["']([^"']+)["']\)/)
  if (hasPropertyMatch) {
    const propName = hasPropertyMatch[1]
    const value = getProperty(doc, propName)
    return value !== undefined && value !== null && value !== ''
  }

  // file.ext == "md" - file extension check
  const extMatch = trimmed.match(/file\.ext\s*(==|!=)\s*["']([^"']+)["']/)
  if (extMatch) {
    const [, op, extVal] = extMatch
    const docExt = (doc.extension || doc.meta?.extension || 'md').toLowerCase().replace(/^\./, '')
    const targetExt = extVal.toLowerCase().replace(/^\./, '')
    return op === '==' ? docExt === targetExt : docExt !== targetExt
  }

  // Regular expression: /pattern/.matches(string) or /pattern/.matches(file.name)
  const regexMatch = trimmed.match(/^\/([^/]+)\/\.matches\(([^)]+)\)$/)
  if (regexMatch) {
    try {
      const pattern = regexMatch[1]
      const target = regexMatch[2].trim()
      const regex = new RegExp(pattern)

      // Determine what to match against
      let valueToTest = ''
      if (target === 'file.name' || target === 'file.basename') {
        valueToTest = getFileName(doc)
      } else if (target === 'file.path') {
        valueToTest = doc.path || ''
      } else {
        valueToTest = getProperty(doc, target) || ''
      }

      return regex.test(String(valueToTest))
    } catch {
      return true // Invalid regex, don't filter
    }
  }

  // Comparison: property == value, property != value, etc.
  const compMatch = trimmed.match(/^(\w+(?:\.\w+)?)\s*(==|!=|>|<|>=|<=)\s*["']?([^"']+)["']?$/)
  if (compMatch) {
    const [, prop, op, val] = compMatch
    const docVal = getProperty(doc, prop)

    switch (op) {
      case '==': return String(docVal) === val
      case '!=': return String(docVal) !== val
      case '>': return Number(docVal) > Number(val)
      case '<': return Number(docVal) < Number(val)
      case '>=': return Number(docVal) >= Number(val)
      case '<=': return Number(docVal) <= Number(val)
    }
  }

  return true
}

/**
 * Get the filename from a document (without extension)
 */
function getFileName(doc: any): string {
  // Try _file property first (set by shadow asset generation) - more reliable
  if (doc._file) {
    const parts = doc._file.split('/')
    const filename = parts[parts.length - 1]
    // Remove extension
    return filename.replace(/\.[^.]+$/, '')
  }

  // Try title, but strip common extensions if present
  if (doc.title) {
    // Remove image/asset extensions from title if present
    return doc.title.replace(/\.(jpeg|jpg|png|gif|svg|webp|bmp|ico|pdf|mp4|mp3|wav)$/i, '')
  }

  // Fall back to path
  const path = doc.path || ''
  const parts = path.split('/')
  const filename = parts[parts.length - 1] || ''
  // Remove .md extension if present
  return filename.replace(/\.md$/, '')
}

/**
 * Get a property from doc, supporting dot notation
 * Nuxt Content v3 nests frontmatter properties in doc.meta
 */
function getProperty(doc: any, path: string): any {
  // Handle note.* prefix (frontmatter property)
  if (path.startsWith('note.')) {
    path = path.slice(5)
  }
  // Handle file.* prefix
  if (path.startsWith('file.')) {
    const fileProp = path.slice(5)
    switch (fileProp) {
      case 'name':
      case 'basename':
        return getFileName(doc)
      case 'path':
        return doc.path
      case 'folder':
        const parts = (doc.path || '').split('/')
        parts.pop() // Remove filename
        return parts.join('/')
      case 'ext':
      case 'extension':
        return doc.extension || doc.meta?.extension || 'md'
      case 'mtime':
        return doc._mtime || doc.mtime || doc.meta?.mtime || doc.updatedAt || doc.meta?.date || doc.date
      case 'ctime':
        return doc._ctime || doc.ctime || doc.meta?.ctime || doc.createdAt
      case 'tags':
        return doc.tags || doc.meta?.tags || []
      case 'icon':
        return doc.icon || doc.navigation?.icon || doc.meta?.icon || doc.meta?.navigation?.icon
      case 'file':
        // For assets: return the raw file path for images
        // Check both top-level and meta (Nuxt Content v3 stores frontmatter in meta)
        return doc.image || doc.meta?.image || doc.cover || doc.meta?.cover || doc._file || doc.meta?._file || null
      default:
        return doc[fileProp] ?? doc.meta?.[fileProp]
    }
  }

  // Direct property access - check both top-level and meta
  // First try top-level
  if (doc[path] !== undefined) {
    return doc[path]
  }

  // Then try meta (where Nuxt Content v3 stores frontmatter)
  if (doc.meta && doc.meta[path] !== undefined) {
    return doc.meta[path]
  }

  // Handle dot notation for nested properties
  const parts = path.split('.')
  if (parts.length > 1) {
    let value = doc
    for (const part of parts) {
      if (value === null || value === undefined) return undefined
      value = value[part]
    }
    if (value !== undefined) return value

    // Also try from meta
    value = doc.meta
    for (const part of parts) {
      if (value === null || value === undefined) return undefined
      value = value[part]
    }
    return value
  }

  return undefined
}

// Fetch and filter notes
const { data: notes, status, refresh } = await useAsyncData(
  `base-${JSON.stringify(baseConfig.value)}`,
  async () => {
    const { source, filters } = baseConfig.value
    const currentView = baseConfig.value.views[activeView.value]
    
    // Get docs from both collections
    // Note: If assets collection doesn't exist (e.g. no assets generated yet), queryCollection might fail or return empty?
    // We try/catch the assets query just in case
    let assetDocs: any[] = []
    try {
      assetDocs = await queryCollection('assets' as any).all()
    } catch (e) {
      // Ignore if assets collection unavailable
    }
    
    const contentDocs = await queryCollection('docs').all()
    const allDocs = [...contentDocs, ...assetDocs]
    
    // Initial system file exclusion
    let filtered = allDocs.filter(doc => {
      const path = doc.path || ''
      const id = (doc as any).id || (doc as any)._id || ''
      const stem = (doc as any).stem || ''
      
      // Exclude system files
      if (path.includes('.obsidian') || id.includes('.obsidian')) return false
      if (path.endsWith('.json') || path.endsWith('.yml')) return false
      if (path.includes('.navigation')) return false
      if (stem === 'index') return false
      
      return true
    })
    
    // Filter by source folder if specified
    if (source) {
      const sourcePath = source.startsWith('/') ? source : `/${source}`
      filtered = filtered.filter(doc => 
        doc.path?.toLowerCase().includes(sourcePath.toLowerCase().replace(/\/$/, ''))
      )
    }
    
    // Debug log for assets
    if (baseConfig.value.filters && JSON.stringify(baseConfig.value.filters).includes('Assets')) {
       console.log('[ObsidianBase] filtered docs for Assets:', filtered.length)
       if (filtered.length === 0) {
          // Fallback: if we found 0 docs but expected assets, try to manually query them again if they weren't in the initial mix
          if (assetDocs.length === 0) {
             console.log('[ObsidianBase] Asset docs were empty, re-verifying...')
          }
       }
    }
    
    // Apply global filters
    if (filters) {
      filtered = filtered.filter(doc => evaluateFilter(filters, doc))
    }
    
    // Apply view-specific filters
    if (currentView?.filters) {
      filtered = filtered.filter(doc => evaluateFilter(currentView.filters, doc))
    }
    
    // Apply sorting - prefer userSort, then config sort, then default
    const sortConfig = currentView?.sort
    if (userSort.value) {
      // User-initiated column sort
      const { column, direction } = userSort.value
      const dir = direction === 'desc' ? -1 : 1
      filtered = [...filtered].sort((a, b) => {
        let aVal = getProperty(a, column)
        let bVal = getProperty(b, column)
        
        // Handle date strings
        if (typeof aVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(aVal)) {
          aVal = new Date(aVal).getTime()
        }
        if (typeof bVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(bVal)) {
          bVal = new Date(bVal).getTime()
        }
        
        if (aVal === bVal) return 0
        if (aVal === undefined || aVal === null || Number.isNaN(aVal)) return 1
        if (bVal === undefined || bVal === null || Number.isNaN(bVal)) return -1
        
        const cmp = typeof aVal === 'string' && typeof bVal === 'string'
          ? aVal.localeCompare(bVal, undefined, { numeric: true })
          : (aVal < bVal ? -1 : 1)
        return cmp * dir
      })
    } else if (sortConfig?.length) {
      // Config-based sort
      filtered = [...filtered].sort((a, b) => {
        for (const sort of sortConfig) {
          const prop = sort.property
          const dir = sort.direction === 'DESC' ? -1 : 1
          
          let aVal = getProperty(a, prop)
          let bVal = getProperty(b, prop)
          
          // Handle date strings - convert to timestamps for comparison
          if (typeof aVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(aVal)) {
            aVal = new Date(aVal).getTime()
          }
          if (typeof bVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(bVal)) {
            bVal = new Date(bVal).getTime()
          }
          
          if (aVal === bVal) continue
          if (aVal === undefined || aVal === null || Number.isNaN(aVal)) return 1 * dir
          if (bVal === undefined || bVal === null || Number.isNaN(bVal)) return -1 * dir
          if (aVal < bVal) return -1 * dir
          if (aVal > bVal) return 1 * dir
        }
        return 0
      })
    } else {
      // Default sort by title
      filtered = [...filtered].sort((a, b) => 
        (a.title || '').localeCompare(b.title || '')
      )
    }
    
    // Apply limit if specified
    const limit = currentView?.limit
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit)
    }
    
    return filtered
  },
  { watch: [activeView, userSort] }
)

// Get image property for cards (with baseURL support)
const getCardImage = (doc: any): string | null => {
  const currentView = baseConfig.value.views[activeView.value]

  let imagePath: string | null = null
  
  // If no image config, use doc.cover or meta.cover
  if (!currentView?.image) {
    imagePath = doc.cover || doc.meta?.cover || doc.image || doc.meta?.image || null
  } else {
    // Parse image property (e.g., "note.cover", "file.file")
    imagePath = getProperty(doc, currentView.image) || null
  }
  
  // Apply baseURL for absolute paths (same as ProseImg.vue)
  if (imagePath?.startsWith('/') && !imagePath.startsWith('//')) {
    const baseURL = useRuntimeConfig().app.baseURL
    return withBase(imagePath, baseURL)
  }
  
  return imagePath
}

// Keys to exclude from table columns
const excludedKeys = new Set([
  'body', 'excerpt', 'meta', 'seo', 'head', 'navigation', 'links',
  'id', '_id', '__hash__', 'stem', 'extension', 'dir',
  'isDailyNote', 'type', 'year', 'month', 'day', 'displayDate'
])

// Generate table columns
const tableColumns = computed(() => {
  if (!notes.value?.length) return []
  
  const currentView = baseConfig.value.views[activeView.value]
  
  // Use order/columns from view config
  if (currentView?.order?.length) {
    return currentView.order.map(key => ({
      key: key.replace(/^(note\.|file\.)/, ''),
      label: baseConfig.value.properties?.[key]?.displayName || formatLabel(key),
      sortable: true
    }))
  }
  
  if (currentView?.columns?.length) {
    return currentView.columns.map(key => ({
      key,
      label: baseConfig.value.properties?.[key]?.displayName || formatLabel(key),
      sortable: true
    }))
  }
  
  // Auto-detect columns - check both top-level and meta properties
  const allKeys = new Set<string>()
  notes.value.forEach(note => {
    // Top-level properties
    Object.keys(note).forEach(key => {
      if (!key.startsWith('_') && !excludedKeys.has(key)) {
        allKeys.add(key)
      }
    })
    // Also check meta for frontmatter properties
    if (note.meta && typeof note.meta === 'object') {
      Object.keys(note.meta).forEach(key => {
        if (!key.startsWith('_') && !excludedKeys.has(key)) {
          allKeys.add(key)
        }
      })
    }
  })

  const priority = ['title', 'description', 'date', 'tags', 'cover']
  return [
    ...priority.filter(k => allKeys.has(k)),
    ...Array.from(allKeys).filter(k => !priority.includes(k) && k !== 'meta').slice(0, 5)
  ].map(key => ({
    key,
    label: formatLabel(key),
    sortable: true
  }))
})

function formatLabel(key: string): string {
  return key
    .replace(/^(note\.|file\.)/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim()
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// Check if a note is an asset (non-page content like images)
function isAsset(note: any): boolean {
  // Assets come from the 'assets' collection and typically have image extensions
  // or are marked with _isAsset flag
  const ext = note.extension || note.meta?.extension || ''
  const isImageExt = /^(png|jpg|jpeg|gif|svg|webp|bmp|ico|avif)$/i.test(ext)
  const hasAssetFlag = note._isAsset === true || note.meta?._isAsset === true
  const isFromAssetsPath = (note._file || '').includes('/Assets/') || (note.path || '').toLowerCase().includes('/assets/')
  return isImageExt || hasAssetFlag || isFromAssetsPath
}

function goToNote(note: any) {
  // Don't navigate for assets - they're not pages
  if (isAsset(note)) return
  navigateTo(note.path)
}

// Card styling from view config
const cardStyle = computed(() => {
  const view = baseConfig.value.views[activeView.value]
  const size = view?.cardSize || 280
  return {
    '--card-size': `${size}px`,
    '--image-fit': view?.imageFit || 'cover',
    '--image-ratio': view?.imageAspectRatio || 0.5625
  }
})
const displayTitle = computed(() => {
  return props.title || (baseConfig.value.views.length === 1 && baseConfig.value.views[0]?.name) || 'Base'
})

const route = useRoute()
const shouldHideHeader = computed(() => {
  // If we are on a page that IS this base (e.g. /bases/posts), the page title likely duplicates this header
  // Check if the current route title matches our title
  // This is a heuristic: if we are at the route corresponding to this file, we might want to hide it
  // But safer is: if query param 'hideBaseHeader' is present
  return false 
  // For now, let's keep it visible but maybe we can just make it look different? 
  // User asked to fix "double title". Usually caused because the .base file has "title: Posts" frontmatter
  // which becomes the H1, and then the component renders "Posts" in the summary.
})
</script>

<template>
  <details class="obsidian-base" open>
    <!-- Collapsible header with title -->
    <summary class="base-header" v-if="!shouldHideHeader">
      <span class="base-icon">
        <Icon name="heroicons:table-cells" size="16" />
      </span>
      <span class="base-title">
        {{ displayTitle }}
      </span>
      <UBadge v-if="notes?.length" variant="subtle" size="sm" color="neutral">
        {{ notes.length }}
      </UBadge>
      <span class="base-chevron">
        <Icon name="heroicons:chevron-down" size="14" />
      </span>
    </summary>
    
    <!-- View tabs (only show if multiple views) -->
    <div v-if="baseConfig.views.length > 1" class="base-tabs">
      <button
        v-for="(view, index) in baseConfig.views"
        :key="index"
        class="base-tab"
        :class="{ active: activeView === index }"
        @click="activeView = index"
      >
        <Icon
          :name="view.type === 'table' ? 'heroicons:table-cells' :
                 view.type === 'cards' ? 'heroicons:squares-2x2' :
                 view.type === 'list' ? 'heroicons:list-bullet' :
                 'heroicons:calendar'"
          size="16"
        />
        {{ view.name }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="status === 'pending'" class="base-loading">
      <Icon name="heroicons:arrow-path" class="animate-spin" />
      Loading notes...
    </div>

    <!-- Empty state -->
    <div v-else-if="!notes?.length" class="base-empty">
      <Icon name="heroicons:document-magnifying-glass" size="32" />
      <p>No notes found matching the filters.</p>
    </div>

    <!-- Table view -->
    <div v-else-if="baseConfig.views[activeView]?.type === 'table'" class="base-table-wrapper">
      <table class="base-table">
        <thead>
          <tr>
            <th 
              v-for="col in tableColumns" 
              :key="col.key"
              class="sortable-header"
              :class="{ 'sorted': userSort?.column === col.key }"
              @click="toggleColumnSort(col.key)"
            >
              {{ col.label }}{{ getSortIndicator(col.key) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="note in notes" :key="note.path" class="base-row" :class="{ 'cursor-default': isAsset(note) }" @click="goToNote(note)">
            <td v-for="col in tableColumns" :key="col.key">
              <template v-if="col.key === 'title' || col.key === 'name'">
                <NuxtLink v-if="!isAsset(note)" :to="note.path" class="note-link">
                  {{ note.title || note.path?.split('/').pop() }}
                </NuxtLink>
                <span v-else class="note-title-plain">
                  {{ note.title || note.path?.split('/').pop() }}
                </span>
              </template>
              <template v-else-if="Array.isArray(getProperty(note, col.key))">
                <UBadge
                  v-for="item in getProperty(note, col.key)"
                  :key="item"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  class="font-mono mr-1"
                >
                  {{ col.key === 'tags' ? '#' : '' }}{{ item }}
                </UBadge>
              </template>
              <template v-else>
                {{ formatValue(getProperty(note, col.key)) }}
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Cards view -->
    <div v-else-if="baseConfig.views[activeView]?.type === 'cards'" class="base-cards" :style="cardStyle">
      <div v-for="note in notes" :key="note.path" class="base-card" :class="{ 'cursor-default': isAsset(note) }" @click="goToNote(note)">
        <div v-if="getCardImage(note)" class="card-cover group">
          <div class="card-image-wrapper">
            <img :src="getCardImage(note)" :alt="note.title" class="base-card-image" />
            <!-- Noir overlays - same as ProseImg -->
            <div class="scanlines absolute inset-0 z-10 opacity-80 pointer-events-none" :class="{ 'scanlines-dark': isDark }" />
            <div class="accent-tint absolute inset-0 z-20 opacity-40 pointer-events-none" />
            <div class="vignette absolute inset-0 z-30 opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" />
          </div>
        </div>
        <div class="card-content">
          <h4 class="card-title">
            <span v-if="getProperty(note, 'icon')" class="card-icon mr-2">
              <Icon :name="getProperty(note, 'icon')" />
            </span>
            <NuxtLink v-if="!isAsset(note)" :to="note.path">{{ note.title || note.path?.split('/').pop() }}</NuxtLink>
            <span v-else>{{ note.title || note.path?.split('/').pop() }}</span>
          </h4>
          <p v-if="getProperty(note, 'description')" class="card-description">{{ getProperty(note, 'description') }}</p>
          <div v-if="getProperty(note, 'tags')?.length" class="card-tags">
            <UBadge
              v-for="tag in getProperty(note, 'tags')"
              :key="tag"
              color="primary"
              variant="subtle"
              size="sm"
              class="font-mono"
            >
              #{{ tag }}
            </UBadge>
          </div>
        </div>
      </div>
    </div>

    <!-- List view -->
    <div v-else-if="baseConfig.views[activeView]?.type === 'list'" class="base-list">
      <div v-for="note in notes" :key="note.path" class="base-list-item">
        <NuxtLink v-if="!isAsset(note)" :to="note.path" class="list-link">
          <span class="list-title">{{ note.title || note.path?.split('/').pop() }}</span>
          <span v-if="note.description" class="list-description">{{ note.description }}</span>
        </NuxtLink>
        <div v-else class="list-link cursor-default">
          <span class="list-title">{{ note.title || note.path?.split('/').pop() }}</span>
          <span v-if="note.description" class="list-description">{{ note.description }}</span>
        </div>
      </div>
    </div>

  </details>
</template>

<style scoped>
.obsidian-base {
  margin: 1.5rem 0;
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  background: var(--ui-bg);
  overflow: hidden;
}

.base-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  user-select: none;
  background: var(--ui-bg-muted);
  border-bottom: 1px solid var(--ui-border);
  transition: background 0.15s ease;
}

.base-header:hover {
  background: var(--ui-bg-elevated);
}

.base-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ui-text-muted);
  color: var(--ui-text-muted);
  flex-shrink: 0;
}

.card-icon {
  margin-right: 0.5rem;
  display: inline-flex;
  align-items: center;
}

.base-title {
  flex: 1;
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.base-chevron {
  color: var(--ui-text-muted);
  transition: transform 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

details[open] > .base-header .base-chevron {
  transform: rotate(180deg);
}

/* Hide marker in summary */
.base-header::-webkit-details-marker {
  display: none;
}

.base-header::marker {
  display: none;
  content: '';
}

.base-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--ui-bg-muted);
  border-bottom: 1px solid var(--ui-border);
}

.base-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ui-text-muted);
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.base-tab:hover { color: var(--ui-text); background: var(--ui-bg); }
.base-tab.active { color: var(--ui-primary); background: var(--ui-bg); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

.base-loading, .base-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem;
  color: var(--ui-text-muted);
  text-align: center;
}

.animate-spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.base-table-wrapper { overflow-x: auto; }
.base-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.base-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--ui-text-muted);
  background: var(--ui-bg-muted);
  border-bottom: 1px solid var(--ui-border);
  white-space: nowrap;
}
.base-table th.sortable-header {
  cursor: pointer;
  user-select: none;
  transition: color 0.15s ease;
}
.base-table th.sortable-header:hover {
  color: var(--ui-text);
}
.base-table th.sortable-header.sorted {
  color: var(--ui-primary);
}
.base-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--ui-border); vertical-align: top; }
.base-row { cursor: pointer; transition: background 0.15s ease; }
.base-row:hover { background: var(--ui-bg-muted); }
.note-link { color: var(--ui-primary); text-decoration: none; font-weight: 500; }
.note-link:hover { text-decoration: underline; }
.note-title-plain { font-weight: 500; color: var(--ui-text); }
.cursor-default { cursor: default !important; }


.base-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--card-size, 280px), 1fr));
  gap: 1rem;
  padding: 1rem;
}

.base-card {
  border: 1px solid var(--ui-border);
  border-radius: 0.5rem;
  background: var(--ui-bg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;
}
.base-card:hover { border-color: var(--ui-primary); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.card-cover {
  aspect-ratio: 1 / var(--image-ratio, 0.5625);
  overflow: hidden;
  background: var(--ui-bg-muted);
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.card-cover img { width: 100%; height: 100%; object-fit: var(--image-fit, cover); }

/* Noir filter effect for card images - CSS-only, no SVG dependency */
.base-card-image {
  filter: grayscale(100%) sepia(20%) hue-rotate(200deg) saturate(150%) contrast(1.15) brightness(1);
  transition: all 0.5s ease-in-out;
  will-change: transform, filter;
}
.card-content { padding: 1rem; }
.card-title { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 600; }
.card-title a { color: var(--ui-text); text-decoration: none; }
.card-title a:hover { color: var(--ui-primary); }
.card-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-tags { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.75rem; }

.base-list { padding: 0.5rem 0; }
.base-list-item { border-bottom: 1px solid var(--ui-border); }
.base-list-item:last-child { border-bottom: none; }
.list-link {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  transition: background 0.15s ease;
}
.list-link:hover { background: var(--ui-bg-muted); }
.list-title { font-weight: 500; color: var(--ui-text); }
.list-description { font-size: 0.875rem; color: var(--ui-text-muted); }

.base-footer {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: var(--ui-text-muted);
  background: var(--ui-bg-muted);
  border-top: 1px solid var(--ui-border);
  text-align: right;
}
</style>
