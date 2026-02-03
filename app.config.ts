// app.config.ts
export default defineAppConfig({
  // Use a custom violet as primary, zinc for neutrals (closest to macOS grays)
  ui: {
    // Use default lucide icons - they render correctly with NuxtUI
    // Previously tried heroicons but colon format (i-heroicons:name) was causing issues
    icons: {
      check: 'i-lucide-check',
      minus: 'i-lucide-minus'
    },
    
    colors: {
      primary: 'violet',    // Maps to #A58AF9 range
      neutral: 'zinc'       // macOS-like grays
    },
    
    // Component theme overrides
    button: {
      slots: {
        base: 'font-medium'
      }
    },
    
    // Command palette - fix match highlight spacing
    commandPalette: {
      slots: {
        itemLabel: 'truncate text-dimmed',
        itemLabelBase: 'text-highlighted [&>mark]:text-primary-500 [&>mark]:dark:text-primary-400 [&>mark]:bg-transparent [&>mark]:font-semibold',
        itemLabelSuffix: 'text-dimmed [&>mark]:text-primary-500 [&>mark]:dark:text-primary-400 [&>mark]:bg-transparent [&>mark]:font-semibold',
      }
    },
    
    // Content navigation - use 'link' variant to match Docus (no full-width pill background)
    contentNavigation: {
      slots: {
        linkLeadingIcon: 'size-4 mr-1',
        linkTrailing: 'hidden',
      },
      defaultVariants: {
        variant: 'link',
      },
    },
    
    // Container padding: comfortable on mobile, minimal on desktop (sidebars provide margins)
    container: {
      base: 'w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-4'
    },
    
    // UPageBody - remove large bottom padding
    pageBody: {
      base: 'mt-8 space-y-12'
    },
    
    // UPage layout: 10 cols
    // Outer (left+center): 2 + 8
    // Inner (center+right): 7 + 3
    page: {
      slots: {
        root: 'flex flex-col lg:grid lg:grid-cols-10 lg:gap-4',
        left: 'lg:col-span-2',
        center: 'lg:col-span-7',
        right: 'lg:col-span-3 order-first lg:order-last'
      },
      compoundVariants: [
        {
          left: true,
          right: false,
          class: {
            center: 'lg:col-span-8'
          }
        }
      ]
    }
  },
  
  // Docus-specific config
  header: {
    title: 'Lithos',
    logo: true,
    showLinkIcon: true,
    exclude: []
  },
  
  toc: {
    title: 'On this page'
  },
  
  footer: {
    credits: {
      icon: '',
      text: 'Powered by Lithos',
      href: 'https://github.com/jwintz/lithos'
    }
  },
  
  // RSS Feed configuration
  rss: {
    enabled: true,
    title: 'Lithos Journal',
    description: 'Daily notes and posts from the vault',
    contentTypes: ['daily-note', 'post', 'sprint', 'research', 'tutorial'],
    maxItems: 20,
    filterPublished: true // Only include status: 'published'
  }
})
