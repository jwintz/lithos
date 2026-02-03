/**
 * Navigation Filter and Sort Plugin
 * 
 * Intercepts navigation data from Docus/Nuxt Content and applies custom sorting and filtering.
 */
export default defineNuxtPlugin((nuxtApp) => {
  console.log('[FilterNav] Plugin initializing...')

  // Custom folder/page ordering map (titles or slugs)
  const manualOrder: Record<string, number> = {
    'home': 1,
    'about': 2,
    'bases': 3,
    'blog': 4,
    'project': 5,
    'projects': 5,
    'research': 6,
    'colophon': 7
  }

  // Icons for folders
  const folderIcons: Record<string, string> = {
    'bases': 'i-lucide:database',
    'posts': 'i-lucide-file-text',
    'blog': 'i-lucide-scroll',
    'project': 'i-lucide-box',
    'projects': 'i-lucide-box',
    'research': 'i-lucide-microscope'
  }

  // Sub-items order
  const subOrder: Record<string, number> = {
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

  const sortTree = (items: any[], parentTitle?: string) => {
    if (!items || !Array.isArray(items)) return

    items.sort((a, b) => {
      const getOrder = (item: any) => {
        // Priority 1: Explicit order or navigation.order from frontmatter
        if (item.order !== undefined && item.order !== null) return Number(item.order)
        if (item.navigation?.order !== undefined && item.navigation?.order !== null) return Number(item.navigation.order)

        // Priority 2: Numeric prefix in stem's LAST segment (e.g., "1.guide/5.deployment" -> 5)
        const stem = item.stem || ''
        const lastSegment = stem.split('/').pop() || ''
        const prefixMatch = lastSegment.match(/^(\d+)\./)
        if (prefixMatch) return Number(prefixMatch[1])

        // Priority 3: Sub-item specific ordering
        if (item.path && subOrder[item.path.toLowerCase()]) return subOrder[item.path.toLowerCase()]

        // Priority 4: Manual order by title/slug (vault-specific fallback)
        const title = (item.title || '').toLowerCase()
        const slug = (item.path || '').split('/').filter(Boolean).pop()?.toLowerCase()
        if (manualOrder[title] !== undefined) return manualOrder[title]
        if (slug && manualOrder[slug] !== undefined) return manualOrder[slug]

        return 999
      }
      const orderA = getOrder(a)
      const orderB = getOrder(b)
      if (orderA !== orderB) return orderA - orderB
      return (a.title || '').localeCompare(b.title || '')
    })

    items.forEach(item => {
      const slug = (item.path || '').split('/').filter(Boolean).pop()?.toLowerCase()
      const itemPath = (item.path || '').toLowerCase()
      const itemTitle = (item.title || '').toLowerCase()

      // Detect base items by:
      // 1. Path starting with /bases/
      // 2. OR parent folder is "Bases" (handles navigation data corruption)
      const isBaseByPath = itemPath.startsWith('/bases/') && itemPath !== '/bases'
      const isBaseByParent = parentTitle?.toLowerCase() === 'bases'
      const isBaseItem = isBaseByPath || isBaseByParent
      const isBasesFolder = itemPath === '/bases' || itemTitle === 'bases'

      // Debug: log base detection for items under Bases
      if (isBaseByParent || isBasesFolder) {
        console.log(`[FilterNav] Item "${item.title}" - parent: "${parentTitle}", path: "${itemPath}", isBaseItem: ${isBaseItem}, isBaseByParent: ${isBaseByParent}, isBaseByPath: ${isBaseByPath}`)
      }

      if (slug === 'project' && item.title !== 'Projects') item.title = 'Projects'

      // Bases: ALL items under /bases/ (or under Bases folder) get database icon and BASE pill
      // No special treatment based on name - uniform handling
      if (isBasesFolder) {
         item.icon = 'i-lucide:database'
      } else if (isBaseItem) {
         item.icon = 'i-lucide:database'
         item.isBase = true
         // Mark for DOM injection (CSS pseudo-elements conflict with NuxtUI)
         item.class = ((item.class || '') + ' lithos-base-item').trim()
         console.log(`[FilterNav] Added lithos-base-item class to "${item.title}"`)
      } else if (slug && folderIcons[slug]) {
        // Default folder icons (only for non-base items)
        item.icon = folderIcons[slug]
      }

      // Pass current item's title as parent for children
      if (item.children) sortTree(item.children, item.title)
    })
  }

  // Fix corrupted navigation item hrefs and ensure correct active state
  const fixNavigationPaths = () => {
    const sidebar = document.querySelector('aside[data-slot="left"]')
    if (!sidebar) return
    
    const currentPath = window.location.pathname
    
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
    
    // Fix all links that might have wrong paths
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
        
        // Update active styling based on current path
        if (currentPath === correctPath) {
          // This is the active page
          link.classList.remove('text-muted')
          link.classList.add('text-primary', 'font-medium')
        } else {
          // Not the active page - ensure no active styling
          if (link.classList.contains('text-primary')) {
            link.classList.remove('text-primary', 'font-medium')
            link.classList.add('text-muted')
            link.classList.remove('after:bg-primary')
          }
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

  if (process.server) {
    nuxtApp.hook('app:rendered', () => {
       // Inspect payload to find the right key
       console.log('[FilterNav] Server Payload Data Keys:', Object.keys(nuxtApp.payload.data))
       
       // Try common keys
       const keys = Object.keys(nuxtApp.payload.data)
       const navKey = keys.find(k => k.includes('navigation') || k.includes('content'))
       
       if (navKey && nuxtApp.payload.data[navKey]) {
         console.log(`[FilterNav] Sorting Server Payload for key: ${navKey}`)
         sortTree(nuxtApp.payload.data[navKey])
       } else {
         console.log('[FilterNav] Server Navigation NOT FOUND in payload.data')
       }
    })
  } else if (process.client) {
    // Client side - navigation is already sorted on server
    // We only inject UI elements (BASE pills, sidebar controls)
    console.log('[FilterNav] Client Init')

    // Filter Obsidian + Fix Base paths + Inject BASE pills + Sidebar controls
    const postRenderCleanup = () => {
      // Filter .obsidian items
      document.querySelectorAll('aside a, nav a').forEach(item => {
        const href = item.getAttribute('href') || ''
        if (href.includes('.obsidian')) {
          const parent = item.closest('li') || item.parentElement
          if (parent) (parent as HTMLElement).style.display = 'none'
        }
      })
      
      // Fix corrupted Base item paths (must run before pills to avoid duplicate active states)
      fixNavigationPaths()
      
      // Inject BASE pills
      injectBasePills()
      
      // Inject sidebar collapse/expand controls
      injectSidebarControls()
      
      // Ensure the folder containing the current page is expanded
      ensureActiveFolderExpanded()
    }
    
    // Run after mount with multiple attempts to catch late-rendering navigation
    nuxtApp.hook('app:mounted', () => {
       // Multiple attempts with increasing delays
       setTimeout(postRenderCleanup, 100)
       setTimeout(postRenderCleanup, 300)
       setTimeout(postRenderCleanup, 500)
    })
    
    // Also run on route changes
    const router = useRouter()
    router.afterEach(() => {
      setTimeout(postRenderCleanup, 100)
      setTimeout(postRenderCleanup, 300)
    })
    
    // Watch for navigation DOM changes with MutationObserver
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        // Run BASE pill injection on any sidebar change
        // (folder expand/collapse causes child DOM changes)
        const sidebarChanged = mutations.some(m => {
          const target = m.target as Element
          return target?.closest?.('aside[data-slot="left"]') || 
                 target?.matches?.('aside[data-slot="left"]')
        })
        if (sidebarChanged) {
          // Debounce multiple rapid changes
          injectBasePills()
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
            attributeFilter: ['class', 'aria-expanded']
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
