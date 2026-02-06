/**
 * Navigation Filter and Enhancement Plugin
 *
 * Handles DOM-level enhancements for navigation that cannot be done
 * in the data layer (app.vue transform):
 * - BASE pill injection (DOM elements not supported in nav data)
 * - Sidebar collapse/expand controls
 * - Corrupted navigation path fixing
 * - .obsidian item filtering
 * - Active folder expansion
 *
 * NOTE: Sorting and icon assignment are handled in app.vue's useAsyncData
 * transform via sortNavigationItems() for SSR/client parity.
 */
import {
  folderIcons,
} from '~/composables/useNavSorting'

export default defineNuxtPlugin((nuxtApp) => {
  console.log('[FilterNav] Plugin initializing (DOM enhancements only)...')

  // Track if we're currently making DOM changes to prevent feedback loops
  let isModifyingDOM = false

  // Debounce timer for MutationObserver
  let observerDebounceTimer: ReturnType<typeof setTimeout> | null = null

  // Fix corrupted navigation item hrefs only - trust NuxtUI for active state management
  const fixNavigationPaths = () => {
    const sidebar = document.querySelector('aside[data-slot="left"]')
    if (!sidebar) return

    // Map of item names to correct paths (for items with corrupted navigation data)
    const pathMap: Record<string, string> = {
      // Top-level items
      'Home': '/home',
      'About': '/about',
      'Colophon': '/colophon',
      // Base items
      'Posts': '/bases/posts',
      'Projects': '/bases/projects',
      'Research': '/bases/research',
      'Assets': '/bases/assets',
      'Avatars': '/bases/avatars'
    }

    // Fix all links that might have wrong paths - ONLY fix hrefs, don't touch active state
    sidebar.querySelectorAll('a[data-slot="link"]').forEach(link => {
      const titleSpan = link.querySelector('[data-slot="linkTitle"]')
      const title = titleSpan?.textContent?.trim()

      if (title && pathMap[title]) {
        const correctPath = pathMap[title]
        const currentHref = link.getAttribute('href')

        // Fix the href if it's wrong
        if (currentHref !== correctPath) {
          link.setAttribute('href', correctPath)
        }
      }
    })
  }

  // Ensure the folder containing the current page is expanded
  const ensureActiveFolderExpanded = () => {
    const sidebar = document.querySelector('aside[data-slot="left"]')
    if (!sidebar) return
    
    // Find the active item
    const activeItem = sidebar.querySelector('a.text-primary.font-medium')
    if (!activeItem) return
    
    // Walk up to find parent folder button
    const parentLi = activeItem.closest('li')?.parentElement?.closest('li')
    const folderBtn = parentLi?.querySelector(':scope > button[aria-expanded="false"]') as HTMLButtonElement
    
    // If folder is collapsed, expand it
    if (folderBtn) {
      folderBtn.click()
    }
  }

  // Inject BASE pills into the DOM (called client-side after render)
  const injectBasePills = () => {
    // Strategy 1: Find items with lithos-base-item class
    document.querySelectorAll('[data-slot="left"] .lithos-base-item').forEach(link => {
      if (link.querySelector('.base-pill')) return
      
      const pill = document.createElement('span')
      pill.className = 'base-pill'
      pill.textContent = 'BASE'
      pill.setAttribute('aria-hidden', 'true')
      link.appendChild(pill)
    })
    
    // Strategy 2: Find items that are children of "Bases" folder
    // This catches items whose path data is corrupted but are visually under Bases
    const basesButton = Array.from(document.querySelectorAll('aside[data-slot="left"] button'))
      .find(btn => btn.textContent?.trim() === 'Bases')
    
    if (basesButton) {
      // Find the parent li/div and its sibling ul containing children
      const basesLi = basesButton.closest('li')
      if (basesLi) {
        const childList = basesLi.querySelector('ul, [role="group"]')
        if (childList) {
          // All direct child links/buttons under Bases should be base items
          childList.querySelectorAll(':scope > li > a, :scope > li > button').forEach(item => {
            // Skip the Bases folder itself
            if (item.textContent?.trim() === 'Bases') return
            
            // Add lithos-base-item class if not present
            if (!item.classList.contains('lithos-base-item')) {
              item.classList.add('lithos-base-item')
            }
            
            // Set database icon - find the icon span and replace classes
            const iconSpan = item.querySelector('[data-slot="linkLeadingIcon"]')
            if (iconSpan) {
              // Check if it already has database icon
              if (!iconSpan.classList.contains('i-lucide:database')) {
                // Remove all i-* icon classes
                Array.from(iconSpan.classList).forEach(c => {
                  if (c.startsWith('i-')) iconSpan.classList.remove(c)
                })
                iconSpan.classList.add('i-lucide:database')
              }
            }
            
            // Skip if already has pill
            if (item.querySelector('.base-pill')) return
            
            // Create and append pill
            const pill = document.createElement('span')
            pill.className = 'base-pill'
            pill.textContent = 'BASE'
            pill.setAttribute('aria-hidden', 'true')
            item.appendChild(pill)
          })
        }
      }
    }
  }

  // Inject sidebar collapse/expand controls
  const injectSidebarControls = () => {
    // Target the aside element specifically (not header slots)
    const sidebar = document.querySelector('aside[data-slot="left"]')
    if (!sidebar || sidebar.querySelector('.sidebar-controls')) return
    
    // SVG icons (Lucide chevrons-down-up and chevrons-up-down)
    const collapseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 20 5-5 5 5"/><path d="m7 4 5 5 5-5"/></svg>`
    const expandIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>`
    
    // Create controls container with title
    const controls = document.createElement('div')
    controls.className = 'sidebar-controls'
    controls.innerHTML = `
      <span class="sidebar-title">Navigation</span>
      <div class="sidebar-buttons">
        <button class="control-btn" title="Collapse all folders" data-action="collapse">
          ${collapseIcon}
        </button>
        <button class="control-btn" title="Expand all folders" data-action="expand">
          ${expandIcon}
        </button>
      </div>
    `
    
    // Add click handlers
    controls.querySelector('[data-action="collapse"]')?.addEventListener('click', () => {
      // Find ALL active items (there may be multiple due to shared paths)
      const activeItems = sidebar.querySelectorAll('a.text-primary.font-medium')
      const activeFolders = new Set<string>()
      
      activeItems.forEach(activeItem => {
        const parentLi = activeItem.closest('li')?.parentElement?.closest('li')
        const folderBtn = parentLi?.querySelector(':scope > button[aria-expanded]')
        const folderText = folderBtn?.textContent?.trim()
        if (folderText) activeFolders.add(folderText)
      })
      
      sidebar.querySelectorAll('button[aria-expanded="true"]').forEach(btn => {
        const text = btn.textContent?.trim()
        if (text && !text.includes('Search') && !text.includes('Toggle') && !text.includes('Collapse') && !text.includes('Expand')) {
          // Skip any folder containing an active page
          if (activeFolders.has(text)) return
          (btn as HTMLButtonElement).click()
        }
      })
    })
    
    controls.querySelector('[data-action="expand"]')?.addEventListener('click', () => {
      sidebar.querySelectorAll('button[aria-expanded="false"]').forEach(btn => {
        const text = btn.textContent?.trim()
        if (text && !text.includes('Search') && !text.includes('Toggle') && !text.includes('Collapse') && !text.includes('Expand')) {
          (btn as HTMLButtonElement).click()
        }
      })
      // Re-inject BASE pills after expanding (DOM changes remove them)
      setTimeout(() => injectBasePills(), 100)
    })
    
    // Insert at the top of the sidebar aside
    sidebar.insertBefore(controls, sidebar.firstChild)
  }

  if (process.client) {
    console.log('[FilterNav] Client Init - DOM enhancements')

    // Filter Obsidian + Fix Base paths + Inject BASE pills + Sidebar controls
    const postRenderCleanup = () => {
      // Skip if we're already modifying DOM (prevents feedback loops)
      if (isModifyingDOM) return
      isModifyingDOM = true

      // Filter .obsidian items
      document.querySelectorAll('aside a, nav a').forEach(item => {
        const href = item.getAttribute('href') || ''
        if (href.includes('.obsidian')) {
          const parent = item.closest('li') || item.parentElement
          if (parent) (parent as HTMLElement).style.display = 'none'
        }
      })

      // Fix corrupted Base item paths (only fixes hrefs now, not active state)
      fixNavigationPaths()

      // Inject BASE pills
      injectBasePills()

      // Inject sidebar collapse/expand controls
      injectSidebarControls()

      // Ensure the folder containing the current page is expanded
      ensureActiveFolderExpanded()

      isModifyingDOM = false
    }

    // Run after mount - single attempt with reasonable delay
    nuxtApp.hook('app:mounted', () => {
      // Single attempt after navigation has rendered
      setTimeout(postRenderCleanup, 150)
    })

    // Also run on route changes
    const router = useRouter()
    router.afterEach(() => {
      // Clear any pending debounce timer
      if (observerDebounceTimer) {
        clearTimeout(observerDebounceTimer)
        observerDebounceTimer = null
      }
      // Single cleanup after route change
      setTimeout(postRenderCleanup, 150)
    })
    
    // Watch for navigation DOM changes with MutationObserver
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        // Skip if we're the source of the DOM changes
        if (isModifyingDOM) return

        // Check if sidebar actually changed
        const sidebarChanged = mutations.some(m => {
          const target = m.target as Element
          return target?.closest?.('aside[data-slot="left"]') ||
                 target?.matches?.('aside[data-slot="left"]')
        })

        if (sidebarChanged) {
          // Debounce: wait 100ms before acting on changes
          if (observerDebounceTimer) {
            clearTimeout(observerDebounceTimer)
          }
          observerDebounceTimer = setTimeout(() => {
            observerDebounceTimer = null
            // Only inject BASE pills - don't re-sort or manipulate active state
            injectBasePills()
          }, 100)
        }
      })

      // Start observing once the sidebar exists
      const startObserving = () => {
        const sidebar = document.querySelector('aside[data-slot="left"]')
        if (sidebar) {
          observer.observe(sidebar, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-expanded'] // Only watch expand/collapse, not class changes
          })
        } else {
          // Retry if sidebar not found yet
          setTimeout(startObserving, 200)
        }
      }
      setTimeout(startObserving, 100)
    }
  }
})
