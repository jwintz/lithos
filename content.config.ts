import { defineContentConfig, defineCollection, z } from '@nuxt/content'
import { useNuxt } from '@nuxt/kit'
import { joinURL } from 'ufo'
import { existsSync, readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

const { options } = useNuxt()

// .lithosignore parsing
let lithosIgnorePatterns: string[] = []
try {
  // Try to find vault path from environment or CLI args
  const args = process.argv
  const vaultArgIndex = args.findIndex(arg => arg.startsWith('--vault='))
  let vaultPath = process.env.LITHOS_VAULT_PATH
  if (vaultArgIndex !== -1) {
    vaultPath = args[vaultArgIndex].split('=')[1]
  }
  
  const absoluteVaultPath = vaultPath ? resolve(vaultPath) : null
  const ignorePath = absoluteVaultPath ? join(absoluteVaultPath, '.lithosignore') : join(options.rootDir, 'content', '.lithosignore')
  
  if (existsSync(ignorePath)) {
    const ignoreContent = readFileSync(ignorePath, 'utf8')
    lithosIgnorePatterns = ignoreContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .flatMap(line => {
          const patterns = [line]
          if (!line.startsWith('**/')) {
             patterns.push(`**/${line}`)
          }
          if (!line.includes('.')) {
              patterns.push(`${line}/**`)
              if (!line.startsWith('**/')) {
                  patterns.push(`**/${line}/**`)
              }
          }
          return patterns
      })
  }
} catch (e) {
  // Silent fallback
}

// Schema matching Docus expectations with Obsidian frontmatter support
const createDocsSchema = () => z.object({
  // Docus-specific fields
  links: z.array(z.object({
    label: z.string(),
    icon: z.string(),
    to: z.string(),
    target: z.string().optional(),
  })).optional(),

  // Core Obsidian frontmatter
  title: z.string().optional(),
  description: z.string().optional(),
  date: z.union([z.string(), z.date()]).optional(),
  tags: z.array(z.string()).optional(),
  aliases: z.array(z.string()).optional(),

  // Academic vault - Post fields
  type: z.enum(['sprint', 'research', 'tutorial', 'release']).optional(),
  team: z.string().optional(),
  project: z.string().optional(),  // Wikilink string like "[[Project/Name]]"
  status: z.string().optional(),   // draft | published | active | archived | planned

  // Academic vault - Project fields
  started: z.union([z.string(), z.date()]).optional(),
  repository: z.string().url().optional(),
  documentation: z.string().url().optional(),

  // Academic vault - Research fields
  concluded: z.union([z.string(), z.date()]).optional(),
  outcome: z.enum(['adopted', 'rejected', 'deferred']).optional(),

  // File metadata (injected by obsidian-transform / obsidian-bases)
  mtime: z.string().optional(),
  order: z.number().optional(),
  isBase: z.boolean().optional(),
  navigation: z.union([
    z.boolean(),
    z.object({
      title: z.string().optional(),
      icon: z.string().optional(),
      order: z.number().optional(),
      isBase: z.boolean().optional(),
    })
  ]).optional(),

  // Links extracted by obsidian-transform for graph
  links: z.array(z.string()).optional(),

  // Catch-all for other frontmatter properties
}).passthrough()

// Patterns to exclude from content processing
const excludePatterns = [
  '.git/**',         // Git repository
  '.obsidian/**',    // Obsidian config
  '.trash/**',       // Obsidian trash
  '.claude/**',      // Claude config
  'node_modules/**', // Dependencies
  'lithos/**',       // Cloned lithos repo in CI
  '**/lithos/**',    // Nested lithos paths
  'public/**',       // Build output
  '.output/**',      // Nuxt output
  '.nuxt/**',        // Nuxt build
  '.data/**',        // Nuxt data
  '**/.DS_Store',    // macOS files
  '**/*.canvas',     // Obsidian canvas files (unsupported)
  '**/AGENTS.md',
  '**/README.md',
  '**/TODO.md',
  '**/package.json',
  '**/.gitlab-ci.yml',
  '**/nuxt.config.ts',
  '**/Templates/**',
  ...lithosIgnorePatterns
]

export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: (() => {
        // When using an external vault via --vault, only include content/ (the external vault)
        // When no --vault (developing Lithos itself), include both content/ and vault/
        const args = process.argv
        const vaultArgIndex = args.findIndex(arg => arg.startsWith('--vault='))
        const customVaultPath = process.env.LITHOS_VAULT_PATH || (vaultArgIndex !== -1 ? args[vaultArgIndex].split('=')[1] : null)

        if (customVaultPath) {
          // External vault mode: only include content/
          return {
            cwd: resolve(options.rootDir, 'content'),
            include: '**/*.{md,base}',
            exclude: excludePatterns,
          }
        }

        // Default mode (developing Lithos): include both content/ and vault/
        // Note: content/ should be symlinked to vault/ for Lithos's own site
        return [
          {
            cwd: resolve(options.rootDir, 'content'),
            include: '**/*.{md,base}',
            exclude: excludePatterns,
          },
          {
            cwd: resolve(options.rootDir, 'vault'),
            include: '**/*.{md,base}',
            exclude: excludePatterns,
          }
        ]
      })(),
      schema: createDocsSchema(),
    }),
    assets: defineCollection({
      type: 'page',
      source: {
        cwd: resolve(options.rootDir, '.nuxt/content-assets'),
        include: '**/*.md', // Shadow files are markdown
      }
    })
  }
})
