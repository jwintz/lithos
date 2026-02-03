/**
 * Vault Theme Module
 * 
 * Loads per-vault theme configuration from lithos.config.ts and applies
 * custom fonts, colors, and styling.
 */
import { defineNuxtModule, addTemplate, useNuxt } from '@nuxt/kit'
import { existsSync, readFileSync } from 'fs'
import { resolve, join } from 'path'

interface VaultThemeConfig {
  site?: {
    name?: string
    description?: string
  }
  theme?: {
    fonts?: {
      sans?: string
      serif?: string
      mono?: string
    }
    colors?: {
      primary?: Record<string, string>
      light?: Record<string, string>
      dark?: Record<string, string>
    }
    images?: {
      noir?: {
        enabled?: boolean
        grayscale?: number
        contrast?: number
        hoverRestore?: boolean
      }
      scanlines?: {
        enabled?: boolean
        opacity?: number
      }
      vignette?: {
        enabled?: boolean
        opacity?: number
      }
    }
    typography?: {
      headingTracking?: string
      bodyTracking?: string
      codeTracking?: string
    }
  }
  header?: Record<string, any>
  footer?: Record<string, any>
}

export default defineNuxtModule({
  meta: {
    name: 'vault-theme',
    configKey: 'vaultTheme'
  },

  async setup(options, nuxt) {
    const vaultPath = nuxt.options.runtimeConfig?.vaultPath as string | undefined
    const contentPath = resolve(nuxt.options.rootDir, 'content')
    
    // Look for lithos.config.ts in vault or content directory
    const configPaths = [
      vaultPath ? join(vaultPath, 'lithos.config.ts') : null,
      join(contentPath, 'lithos.config.ts')
    ].filter(Boolean) as string[]

    let vaultConfig: VaultThemeConfig | null = null

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        try {
          // Read and parse the config file
          const configContent = readFileSync(configPath, 'utf8')
          
          // Extract the default export object using regex
          // This is a simplified parser - in production you'd use proper TS compilation
          const match = configContent.match(/export\s+default\s+({[\s\S]*})/)
          if (match) {
            // Use eval to parse the object (safe since it's a local trusted file)
            // In production, use a proper TypeScript compiler
            vaultConfig = eval(`(${match[1]})`)
            console.log(`[VaultTheme] Loaded config from: ${configPath}`)
            break
          }
        } catch (e) {
          console.warn(`[VaultTheme] Failed to parse ${configPath}:`, e)
        }
      }
    }

    if (!vaultConfig) {
      console.log('[VaultTheme] No vault config found, using defaults')
      return
    }

    // Generate CSS for the theme
    const themeCss = generateThemeCss(vaultConfig)
    
    // Add the generated CSS as a virtual template
    addTemplate({
      filename: 'vault-theme.css',
      write: true,
      getContents: () => themeCss
    })

    // Add the CSS to the build
    nuxt.options.css.push(resolve(nuxt.options.buildDir, 'vault-theme.css'))

    // Add Google Fonts for Recursive if used
    const fontString = JSON.stringify(vaultConfig.theme?.fonts || {})
    if (fontString.includes('Recursive')) {
      // Add Recursive font from Google Fonts
      nuxt.options.app = nuxt.options.app || {}
      nuxt.options.app.head = nuxt.options.app.head || {}
      nuxt.options.app.head.link = nuxt.options.app.head.link || []
      nuxt.options.app.head.link.push({
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com'
      })
      nuxt.options.app.head.link.push({
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: ''
      })
      nuxt.options.app.head.link.push({
        rel: 'stylesheet',
        // Recursive with all variable axes: MONO, CASL, wght, slnt, CRSV
        href: 'https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,CRSV,MONO@-15..0,300..1000,0..1,0..1,0..1&display=swap'
      })
      console.log('[VaultTheme] Added Recursive font from Google Fonts')
    }

    // Expose config to runtime
    nuxt.options.runtimeConfig.public.vaultTheme = vaultConfig
    
    // Update site name if provided
    if (vaultConfig.site?.name) {
      nuxt.options.runtimeConfig.public.siteName = vaultConfig.site.name
    }

    console.log('[VaultTheme] Theme CSS generated and applied')
  }
})

function generateThemeCss(config: VaultThemeConfig): string {
  const lines: string[] = []
  
  lines.push('/* Vault Theme - Auto-generated from lithos.config.ts */')
  lines.push('')

  // Font stack overrides - use CSS custom properties that Tailwind picks up
  if (config.theme?.fonts) {
    lines.push(':root {')
    if (config.theme.fonts.sans) {
      lines.push(`  --font-sans: ${config.theme.fonts.sans};`)
    }
    if (config.theme.fonts.serif) {
      lines.push(`  --font-serif: ${config.theme.fonts.serif};`)
    }
    if (config.theme.fonts.mono) {
      lines.push(`  --font-mono: ${config.theme.fonts.mono};`)
    }
    lines.push('}')
    lines.push('')
    
    // Also set body font-family directly for immediate effect
    if (config.theme.fonts.sans) {
      lines.push('body {')
      lines.push(`  font-family: ${config.theme.fonts.sans};`)
      lines.push('}')
      lines.push('')
    }
  }

  // Primary color palette - use CSS variables that Nuxt UI reads
  if (config.theme?.colors?.primary) {
    lines.push(':root {')
    for (const [shade, color] of Object.entries(config.theme.colors.primary)) {
      lines.push(`  --color-primary-${shade}: ${color};`)
    }
    lines.push('}')
    lines.push('')
  }

  // Light mode colors
  if (config.theme?.colors?.light) {
    lines.push(':root {')
    for (const [key, value] of Object.entries(config.theme.colors.light)) {
      lines.push(`  --vault-${key}: ${value};`)
    }
    lines.push('}')
    lines.push('')
  }

  // Dark mode colors
  if (config.theme?.colors?.dark) {
    lines.push('.dark {')
    for (const [key, value] of Object.entries(config.theme.colors.dark)) {
      lines.push(`  --vault-${key}: ${value};`)
    }
    lines.push('}')
    lines.push('')
  }

  // Image treatment
  if (config.theme?.images?.noir) {
    const noir = config.theme.images.noir
    if (noir.enabled) {
      lines.push('/* Noir image filter */')
      lines.push('.noir-image, .base-card-image {')
      lines.push(`  filter: grayscale(${noir.grayscale || 100}%) contrast(${noir.contrast || 120}%);`)
      lines.push('  transition: filter 0.4s ease;')
      lines.push('}')
      if (noir.hoverRestore) {
        lines.push('.noir-image:hover, .base-card-image:hover,')
        lines.push('.card-cover:hover .base-card-image {')
        lines.push('  filter: grayscale(0%) contrast(100%);')
        lines.push('}')
      }
      lines.push('')
    }
  }

  if (config.theme?.images?.scanlines) {
    const scanlines = config.theme.images.scanlines
    if (scanlines.enabled) {
      lines.push('/* Scanlines overlay */')
      lines.push('.scanlines {')
      lines.push(`  background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, ${scanlines.opacity || 0.03}) 50%);`)
      lines.push('  background-size: 100% 4px;')
      lines.push('}')
      lines.push('')
    }
  }

  if (config.theme?.images?.vignette) {
    const vignette = config.theme.images.vignette
    if (vignette.enabled) {
      lines.push('/* Vignette on hover */')
      lines.push('.vignette {')
      lines.push(`  background: radial-gradient(circle, transparent 40%, rgba(0, 0, 0, ${vignette.opacity || 0.4}) 100%);`)
      lines.push('}')
      lines.push('')
    }
  }

  // Typography settings
  if (config.theme?.typography) {
    const typo = config.theme.typography
    lines.push('/* Typography adjustments */')
    
    if (typo.headingTracking) {
      lines.push('h1, h2, h3, h4, h5, h6 {')
      lines.push(`  letter-spacing: ${typo.headingTracking};`)
      lines.push('}')
    }
    
    if (typo.bodyTracking) {
      lines.push('body, p, li {')
      lines.push(`  letter-spacing: ${typo.bodyTracking};`)
      lines.push('}')
    }
    
    if (typo.codeTracking) {
      lines.push('code, pre, .font-mono {')
      lines.push(`  letter-spacing: ${typo.codeTracking};`)
      lines.push('}')
    }
    lines.push('')
  }

  return lines.join('\n')
}
