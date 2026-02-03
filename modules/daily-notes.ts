/**
 * Daily Notes Module
 *
 * Transforms Obsidian daily notes into blog-style posts.
 * Reads folder configuration from .obsidian/daily-notes.json
 * Routes to /{folder-name}/YYYY/MM/DD
 */
import { defineNuxtModule } from '@nuxt/kit'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface DailyNotesOptions {
  /** Vault directory (default: 'vault') */
  vaultDir: string
  /** Override folder name (reads from .obsidian/daily-notes.json if not set) */
  folder?: string
}

interface ObsidianDailyNotesConfig {
  folder?: string
  format?: string
  template?: string
}

const DAILY_NOTE_REGEX = /^(\d{4})-(\d{2})-(\d{2})(?:[-_](.+))?\.md$/

/**
 * Read daily notes configuration from Obsidian vault
 */
function readObsidianConfig(vaultPath: string): ObsidianDailyNotesConfig {
  const configPath = join(vaultPath, '.obsidian', 'daily-notes.json')
  
  if (!existsSync(configPath)) {
    console.log('[daily-notes] No .obsidian/daily-notes.json found, using defaults')
    return {}
  }
  
  try {
    const content = readFileSync(configPath, 'utf-8')
    const config = JSON.parse(content)
    console.log(`[daily-notes] Read config:`, config)
    return config
  } catch (e) {
    console.warn('[daily-notes] Failed to parse daily-notes.json:', e)
    return {}
  }
}

/**
 * Convert folder name to URL-safe slug
 */
function folderToSlug(folder: string): string {
  return folder
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
}

export default defineNuxtModule<DailyNotesOptions>({
  meta: {
    name: 'obsidian-daily-notes',
    configKey: 'dailyNotes'
  },
  defaults: {
    vaultDir: 'content'
  },
  setup(options, nuxt) {
    // Resolve vault path
    const vaultPath = join(nuxt.options.rootDir, options.vaultDir)
    
    // Read Obsidian configuration
    const obsidianConfig = readObsidianConfig(vaultPath)
    
    // Determine folder name (explicit option > obsidian config > default)
    const folderName = options.folder || obsidianConfig.folder || 'Daily Notes'
    const routePrefix = '/' + folderToSlug(folderName)
    
    console.log(`[daily-notes] Folder: "${folderName}" -> Route: "${routePrefix}"`)
    
    // Transform daily notes paths during content processing
    nuxt.hook('content:file:beforeParse', (ctx: any) => {
      const file = ctx.file

      // Check if this is a markdown file
      const ext = file.extension || file._extension || ''
      if (ext !== '.md' && ext !== 'md') return

      // Get the file path
      const filePath = file.path || file._file || ''

      // Check if file is in the daily notes folder
      const escapedFolder = folderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[ _-]?')
      const folderPattern = new RegExp(`[/\\\\]${escapedFolder}[/\\\\]`, 'i')

      if (!folderPattern.test(filePath)) {
        return
      }

      // Extract date from filename
      const pathParts = filePath.split(/[/\\]/)
      const filename = pathParts[pathParts.length - 1] || ''
      const match = filename.match(DAILY_NOTE_REGEX)

      if (!match) {
        return
      }

      const [, year, month, day, titleSuffix] = match

      // Transform path to route: /{folder-slug}/YYYY/MM/DD
      file.path = `${routePrefix}/${year}/${month}/${day}`

      // Parse date
      const date = new Date(`${year}-${month}-${day}`)
      const isoDate = date.toISOString()
      const displayDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      // Extract title from first H1 in content or use date
      let title = titleSuffix?.replace(/-/g, ' ')
      if (!title && file.body && typeof file.body === 'string') {
        const h1Match = file.body.match(/^#\s+(.+)$/m)
        if (h1Match) {
          title = h1Match[1]
        }
      }
      if (!title) {
        title = `${year}-${month}-${day}`
      }

      // Inject daily note metadata into frontmatter
      // This ensures properties persist through content processing
      let body = file.body || ''
      
      // Check if file has frontmatter
      const hasFrontmatter = body.trimStart().startsWith('---')
      
      if (hasFrontmatter) {
        // Insert properties into existing frontmatter
        body = body.replace(/^---\n/, `---\nisDailyNote: true\ndate: ${isoDate}\ndisplayDate: "${displayDate}"\n`)
      } else {
        // Add frontmatter block
        // Escape quotes in title for safe YAML
        const safeTitle = title.replace(/"/g, '\\"')
        body = `---\nisDailyNote: true\ndate: ${isoDate}\ndisplayDate: "${displayDate}"\ntitle: "${safeTitle}"\n---\n\n${body}`
      }
      
      file.body = body

      console.log(`[daily-notes] ${filename} -> ${file.path}`)
    })

    // Expose route prefix for runtime use
    nuxt.options.runtimeConfig.public.dailyNotesRoute = routePrefix
    nuxt.options.runtimeConfig.public.dailyNotesFolder = folderName
  }
})
