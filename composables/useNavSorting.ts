/**
 * Shared Navigation Sorting Composable
 *
 * Provides consistent sorting logic for navigation items across:
 * - SSR payload sorting (app.vue transform)
 * - Client-side DOM enhancements (filter-navigation.ts)
 * - Surround navigation (slug.vue)
 *
 * Sorting priority:
 * 1. Explicit `order` or `navigation.order` from frontmatter
 * 2. Numeric prefix in stem's last segment (e.g., "1.guide" -> 1)
 * 3. Date-based sorting for date-prefixed files (DESC - newest first)
 * 4. Alphabetical fallback
 */

/**
 * Extract date from a date-prefixed filename for sorting.
 * Matches YYYY-MM-DD pattern in the last path segment.
 * Returns negative timestamp for DESC sort (newer first).
 * Returns null if no date found.
 */
export function extractDateFromPath(path: string): number | null {
  const lastSegment = path.split('/').filter(Boolean).pop() || ''
  const dateMatch = lastSegment.match(/^(\d{4}-\d{2}-\d{2})/)
  if (dateMatch) {
    const timestamp = new Date(dateMatch[1]).getTime()
    return -timestamp
  }
  return null
}

/**
 * Get sort order for a navigation item.
 * Used by both SSR sorting and surround navigation.
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

  // Priority 3: Date-based sorting (returns DESC for date-prefixed files)
  const itemPath = (item.path || '').toLowerCase()
  const dateOrder = extractDateFromPath(itemPath)
  if (dateOrder !== null) {
    // Use a large base number + negative timestamp to ensure date-prefixed files
    // sort after their parent folder but among themselves by date DESC
    return 1000 + dateOrder / 1e12
  }

  // Priority 4: Alphabetical fallback
  return 999
}

/**
 * Sort and decorate navigation items recursively.
 * Returns a new sorted array without mutating the original.
 * Assigns icons and base-item classes from data so that
 * server-rendered HTML matches client expectations (SSR parity).
 */
export function sortNavigationItems<T extends { children?: T[]; title?: string }>(
  items: T[],
  _parentTitle?: string
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

      // Data-driven base item detection (set by obsidian-bases module)
      if (decorated.isBase) {
        decorated.icon = decorated.icon || 'i-lucide:database'
        decorated.class = ((decorated.class || '') + ' lithos-base-item').trim()
      }

      // Recurse into children
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
    getSortOrder,
    sortNavigationItems,
    extractDateFromPath
  }
}
