/**
 * Shared Navigation Sorting Composable
 *
 * Provides consistent sorting logic for navigation items across:
 * - SSR payload sorting (filter-navigation.ts)
 * - Client-side DOM sorting (filter-navigation.ts)
 * - Surround navigation (slug.vue)
 *
 * Sorting priority:
 * 1. Explicit `order` or `navigation.order` from frontmatter
 * 2. Numeric prefix in stem's last segment (e.g., "1.guide" -> 1)
 * 3. Sub-item specific ordering (subOrder map)
 * 4. Blog post date sorting (DESC for blog items)
 * 5. Manual order by title/slug (manualOrder map)
 * 6. Alphabetical fallback
 */

// Custom folder/page ordering map (titles or slugs)
export const manualOrder: Record<string, number> = {
  'home': 1,
  'about': 2,
  'bases': 3,
  'blog': 4,
  'project': 5,
  'projects': 5,
  'research': 6,
  'colophon': 7
}

// Sub-items order (full path match)
export const subOrder: Record<string, number> = {
  '/bases/posts': 3.1,
  '/bases/projects': 3.2,
  '/bases/research': 3.3,
  '/blog/2026-01-20-odin-monitor': 4.1,
  '/projects/odin': 5.1,
  '/projects/hyalo': 5.2,
  '/projects/emacs': 5.3,
  '/projects/emacs-swift': 5.4,
  '/research/emacs-swift-research': 6.1,
  '/research/emacs-swift-implementation': 6.2
}

// Icons for folders
export const folderIcons: Record<string, string> = {
  'bases': 'i-lucide:database',
  'posts': 'i-lucide-file-text',
  'blog': 'i-lucide-scroll',
  'project': 'i-lucide-box',
  'projects': 'i-lucide-box',
  'research': 'i-lucide-microscope'
}

/**
 * Extract blog post date from path for sorting
 * Returns negative timestamp for DESC sort (newer first)
 * Returns null if no date found
 */
export function extractBlogDate(path: string): number | null {
  const dateMatch = path.match(/\/blog\/(\d{4}-\d{2}-\d{2})/)
  if (dateMatch) {
    const timestamp = new Date(dateMatch[1]).getTime()
    // Return negative for DESC sort
    return -timestamp
  }
  return null
}

/**
 * Get sort order for a navigation item
 * Used by both SSR sorting and surround navigation
 */
export function getSortOrder(item: any): number {
  // Priority 1: Explicit order or navigation.order from frontmatter
  if (item.order !== undefined && item.order !== null) {
    return Number(item.order)
  }
  if (item.navigation?.order !== undefined && item.navigation?.order !== null) {
    return Number(item.navigation.order)
  }

  // Priority 2: Numeric prefix in stem's LAST segment (e.g., "1.guide/5.deployment" -> 5)
  const stem = item.stem || ''
  const lastSegment = stem.split('/').pop() || ''
  const prefixMatch = lastSegment.match(/^(\d+)\./)
  if (prefixMatch) {
    return Number(prefixMatch[1])
  }

  // Priority 3: Sub-item specific ordering
  const itemPath = (item.path || '').toLowerCase()
  if (itemPath && subOrder[itemPath]) {
    return subOrder[itemPath]
  }

  // Priority 4: Blog date sorting (returns a value that ensures proper ordering)
  const blogDate = extractBlogDate(itemPath)
  if (blogDate !== null) {
    // Use a large base number + negative timestamp to ensure blog posts
    // sort after their parent folder but among themselves by date DESC
    return 1000 + blogDate / 1e12 // Normalize to reasonable range
  }

  // Priority 5: Manual order by title/slug (vault-specific fallback)
  const title = (item.title || '').toLowerCase()
  const slug = (item.path || '').split('/').filter(Boolean).pop()?.toLowerCase()

  if (manualOrder[title] !== undefined) {
    return manualOrder[title]
  }
  if (slug && manualOrder[slug] !== undefined) {
    return manualOrder[slug]
  }

  return 999
}

/**
 * Sort and decorate navigation items recursively.
 * Returns a new sorted array without mutating the original.
 * Assigns icons, base-item classes, and folder renames so that
 * server-rendered HTML matches client expectations (SSR parity).
 */
export function sortNavigationItems<T extends { children?: T[]; title?: string }>(
  items: T[],
  parentTitle?: string
): T[] {
  return [...items]
    .sort((a, b) => {
      const orderA = getSortOrder(a)
      const orderB = getSortOrder(b)
      if (orderA !== orderB) return orderA - orderB
      // Alphabetical fallback
      return ((a as any).title || '').localeCompare((b as any).title || '')
    })
    .map(item => {
      const decorated = { ...item } as any

      // Decorate this item (icons, classes, renames)
      const itemPath = (decorated.path || '').toLowerCase()
      const slug = itemPath.split('/').filter(Boolean).pop() || ''
      const itemTitle = (decorated.title || '').toLowerCase()

      const isBaseByPath = itemPath.startsWith('/bases/') && itemPath !== '/bases'
      const isBaseByParent = parentTitle?.toLowerCase() === 'bases'
      const isBaseItem = isBaseByPath || isBaseByParent
      const isBasesFolder = itemPath === '/bases' || itemTitle === 'bases'

      if (slug === 'project' && decorated.title !== 'Projects') {
        decorated.title = 'Projects'
      }

      if (isBasesFolder) {
        decorated.icon = 'i-lucide:database'
      } else if (isBaseItem) {
        decorated.icon = 'i-lucide:database'
        decorated.isBase = true
        decorated.class = ((decorated.class || '') + ' lithos-base-item').trim()
      } else if (slug && folderIcons[slug]) {
        decorated.icon = folderIcons[slug]
      }

      // Recurse into children, passing current title as parent
      if (decorated.children && decorated.children.length > 0) {
        decorated.children = sortNavigationItems(decorated.children, decorated.title)
      }

      return decorated as T
    })
}

/**
 * Composable for navigation sorting
 */
export function useNavSorting() {
  return {
    manualOrder,
    subOrder,
    folderIcons,
    getSortOrder,
    sortNavigationItems,
    extractBlogDate
  }
}
