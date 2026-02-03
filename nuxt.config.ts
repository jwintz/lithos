// https://nuxt.com/docs/api/configuration/nuxt-config
import { defineNuxtConfig } from 'nuxt/config'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { existsSync, readFileSync } from 'fs'
import { resolve, join } from 'path'

// CLI support: custom output directory via NITRO_OUTPUT_DIR env var
const outputDir = process.env.NITRO_OUTPUT_DIR

// Resolve vault path and output path from CLI arguments
const args = process.argv
const vaultArgIndex = args.findIndex(arg => arg.startsWith('--vault='))
const outputArgIndex = args.findIndex(arg => arg.startsWith('--output='))

let customVaultPath = process.env.LITHOS_VAULT_PATH
let customOutputPath = process.env.LITHOS_OUTPUT_PATH || process.env.NITRO_OUTPUT_DIR

if (vaultArgIndex !== -1) {
  customVaultPath = args[vaultArgIndex].split('=')[1]
}
if (outputArgIndex !== -1) {
  customOutputPath = args[outputArgIndex].split('=')[1]
}

// Prepare vault directory
const absoluteVaultPath = customVaultPath ? resolve(customVaultPath) : null
console.log('[DEBUG] absoluteVaultPath resolved to:', absoluteVaultPath)

// Landing page detection
let hasLandingPage = false
if (absoluteVaultPath && existsSync(join(absoluteVaultPath, 'index.md'))) {
  hasLandingPage = true
  console.log('[Lithos] Landing page found in vault')
} else if (existsSync(resolve(process.cwd(), 'content/index.md'))) {
  hasLandingPage = true
  console.log('[Lithos] Landing page found in content/')
} else {
  console.log('[Lithos] No landing page found, will redirect to /home')
}

// .lithosignore parsing
let lithosIgnorePatterns: string[] = []
try {
  const ignorePath = absoluteVaultPath ? join(absoluteVaultPath, '.lithosignore') : join(process.cwd(), 'content', '.lithosignore')
  if (existsSync(ignorePath)) {
    const ignoreContent = readFileSync(ignorePath, 'utf8')
    lithosIgnorePatterns = ignoreContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .flatMap(line => {
          // Generate robust glob patterns for Nuxt Content (micromatch)
          // We want to match the file/dir at the root AND anywhere in the tree
          const patterns = []
          
          // 1. Exact match (root)
          patterns.push(line)
          
          // 2. Recursive match (anywhere)
          if (!line.startsWith('**/')) {
             patterns.push(`**/${line}`)
          }
          
          // 3. Directory match (if it might be a folder)
          if (!line.includes('.')) {
              patterns.push(`${line}/**`)
              if (!line.startsWith('**/')) {
                  patterns.push(`**/${line}/**`)
              }
          }
          
          return patterns
      })
    console.log('[Lithos] Loaded ignore patterns:', lithosIgnorePatterns)
  }
} catch (e) {
  // Silent fallback
}

// Site name from vault config or default
// Check both env var (from lithos.mjs) and vault's nuxt.config.ts directly
let siteName = process.env.LITHOS_SITE_NAME || 'Lithos'
if (siteName === 'Lithos') {
  // Try to read from vault's nuxt.config.ts (for dev mode when not using lithos.mjs)
  const vaultConfigPaths = [
    absoluteVaultPath ? join(absoluteVaultPath, 'nuxt.config.ts') : null,
    resolve(__dirname, 'content/nuxt.config.ts')
  ].filter(Boolean) as string[]

  for (const configPath of vaultConfigPaths) {
    if (existsSync(configPath)) {
      try {
        const configContent = readFileSync(configPath, 'utf8')
        const nameMatch = configContent.match(/name:\s*['"]([^'"]+)['"]/)
        if (nameMatch) {
          siteName = nameMatch[1]
          console.log(`[Lithos] Site name from vault config: ${siteName}`)
          break
        }
      } catch (e) {
        // Ignore
      }
    }
  }
}

export default defineNuxtConfig({
  // Site configuration for docus SEO title template
  site: {
    name: siteName,
  },

  // Modern aesthetic defaults via Nuxt UI
  app: {
    // Support subpath deployment (e.g., GitHub Pages project sites)
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: siteName,
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  // Content module configuration
  content: {
    // Global ignores
    ignores: [
      // Proper glob patterns for Micromatch
      '.git', 
      '**/.git/**', 
      '**/.obsidian/**',
      '**/.trash/**',
      '**/node_modules/**',
      '**/.data/**',
      // Explicit strict ignores
      '**/AGENTS.md',
      '**/PLAN.md',
      '**/RESEARCH.md',
      '**/README.md',
      '**/TODO.md',
      '**/package.json',
      '**/.gitlab-ci.yml',
      '**/nuxt.config.ts',
      ...lithosIgnorePatterns.map(p => p.includes('*') ? p : `**/${p}`)
    ],

    // Navigation configuration
    // navigation: {
    //   fields: ['title', 'navigation', 'order', '_order', 'icon']
    // },

    // Dynamic Source Configuration
    sources: {
      content: {
        driver: 'fs',
        base: resolve(__dirname, 'content')
      },
      assets: {
        driver: 'fs',
        base: resolve(__dirname, '.nuxt/content-assets')
      }
    },

    // Build-time markdown processing
    build: {
      markdown: {
        toc: {
          depth: 3,
          searchDepth: 3
        },
        remarkPlugins: {
          'remark-math': { instance: remarkMath }
        },
        rehypePlugins: {
          'rehype-katex': {
            instance: rehypeKatex,
            options: { strict: false, throwOnError: false }
          }
        }
      }
    }
  },

  // CSS and Theme configuration
  css: [
    'katex/dist/katex.min.css',
    '~/assets/css/main.css',
    '~/assets/css/obsidian.css'
  ],

  // Component structure
  components: {
    dirs: [
      { path: '~/components', pathPrefix: false },
      { path: '~/components/content', pathPrefix: false },
      { path: '~/components/prose', pathPrefix: false }
    ]
  },

  // Modules
  modules: [
    '~/modules/vault-theme',
    '~/modules/obsidian-transform',
    '~/modules/obsidian-bases',
    '~/modules/obsidian-graph',
    '~/modules/obsidian-ordering',
    '~/modules/daily-notes',
    '@barzhsieh/nuxt-content-mermaid',
    '@nuxt/ui',
    '@nuxt/icon'
  ],

  plugins: [
    '~/plugins/filter-navigation'
  ],

  // Runtime configuration
  runtimeConfig: {
    vaultPath: absoluteVaultPath,
    ignorePatterns: lithosIgnorePatterns,
    public: {
      hasLandingPage,
      siteName: siteName,
      vaultName: absoluteVaultPath ? absoluteVaultPath.split('/').pop() : process.cwd().split('/').pop() || 'Lithos'
    }
  } as any,

  // Nuxt Image configuration - disable IPX for static generation
  // IPX provider doesn't work in static builds, so use 'none' to bypass all processing
  image: {
    provider: 'none'
  },

  // Vite configuration for performance and OOM prevention
  vite: {
    build: {
      minify: 'esbuild',
      cssCodeSplit: true,
      rollupOptions: {
        maxParallelFileOps: 3,
        // Externalize heavy deps to prevent OOM (but NOT monaco - we need local bundling for workers)
        external: [
          'force-graph',
          '3d-force-graph'
        ],
        output: {
          // Map external package names to CDN URLs
          paths: {
            'force-graph': 'https://esm.sh/force-graph@1.51.0',
            '3d-force-graph': 'https://esm.sh/3d-force-graph'
          },
          // Chunk Monaco separately for better caching
          manualChunks: {
            'monaco-editor': ['monaco-editor']
          }
        }
      }
    },
    optimizeDeps: {
      include: ['monaco-editor'],
      exclude: ['force-graph', '3d-force-graph']
    },
    // Worker configuration for Monaco
    worker: {
      format: 'es'
    }
  },

  // Nitro configuration for Static Site Generation
  nitro: {
    preset: 'static',
    output: customOutputPath ? {
      dir: resolve(customOutputPath),
      publicDir: resolve(customOutputPath)
    } : undefined,
    prerender: {
      routes: hasLandingPage 
        ? ['/', '/home', '/about', '/colophon', '/graph', '/rss.xml'] 
        : ['/home', '/about', '/colophon', '/graph', '/rss.xml'],
      crawlLinks: true,
      failOnError: false,
      concurrency: 1,
      interval: 100
    }
  },

  compatibilityDate: '2024-11-01',

  // Fallback for landing page if not present
  routeRules: {
    // Block access to ignored files in the raw path
    ...Object.fromEntries(lithosIgnorePatterns.map(p => [
        `/_raw/${p.replace(/\\/g, '')}`, 
        { prerender: false, index: false, robots: false, headers: { 'X-Robots-Tag': 'noindex' } }
    ])) as any,
    // For directory-like ignores, use 404
    ...Object.fromEntries(lithosIgnorePatterns.filter(p => p.includes('**')).map(p => [
        `/_raw/${p.replace(/\\/g, '').replace('/**', '/**')}`,
        { status: 404 }
    ])) as any,
    ...(!hasLandingPage && { '/': { redirect: { to: '/home', statusCode: 301 } } })
  },

  // Hooks for static asset mounting
  hooks: {
    // For static builds: mount raw vault files at /_raw so Monaco can fetch them
    'nitro:config' (config) {
      if (absoluteVaultPath && existsSync(absoluteVaultPath)) {
        config.publicAssets = config.publicAssets || []
        config.publicAssets.push({
          dir: absoluteVaultPath,
          maxAge: 3600,
          baseURL: '/_raw'
        })
        console.log(`[Lithos] Mounted vault for raw access at /_raw`)
      }
    }
  }
})



