import { defineNuxtModule, createResolver } from '@nuxt/kit'
import yaml from 'js-yaml'

/**
 * Obsidian Transform Module
 *
 * Transforms Obsidian-specific syntax to Nuxt Content compatible formats:
 * - Wikilinks: [[Page]] → [Page](/page)
 * - Embeds: ![[Note]] → ::note-embed{src="Note"}
 * - Callouts: > [!note] → ::callout{type="note"}
 *
 * Also extracts link data for the graph module.
 */

// Shared state for extracted links (used by obsidian-graph module)
// IMPORTANT: Use WeakMap-like pattern to avoid memory leaks during SSG
// In production SSG, we limit extractedLinks to a reasonable size
const MAX_EXTRACTED_LINKS = 500
export const extractedLinks = new Map<string, string[]>()
export const permalinkMap = new Map<string, string>()

let ignoredPatternsRef: string[] = []

// Track if we're in SSG mode to adjust memory strategies
let isSSGMode = false

// Store protected frontmatter wikilinks temporarily (filePath -> protected values)
// This allows us to restore them in afterParse after MDC processing
const protectedFrontmatterMap = new Map<string, Map<string, string>>()

/**
 * Protect wikilinks in frontmatter from MDC transformation
 * Returns the frontmatter data, content without frontmatter, and a map of protected values
 */
function protectFrontmatterWikilinks(content: string): { 
  frontmatter: Record<string, any> | null
  content: string
  protectedValues: Map<string, string>
} {
  const protectedValues = new Map<string, string>()
  
  // Check if content has frontmatter
  if (!content.trimStart().startsWith('---')) {
    return { frontmatter: null, content, protectedValues }
  }
  
  const endMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---/)
  if (!endMatch) {
    return { frontmatter: null, content, protectedValues }
  }
  
  const frontmatterBlock = endMatch[0]
  let frontmatterContent = frontmatterBlock.slice(3, -3).trim()
  
  // Find and protect wikilinks in frontmatter values
  // Pattern: key: "[[...]]" or key: [[...]] (YAML array style)
  let protectCounter = 0
  
  // Protect quoted wikilinks: "[[...]]"
  frontmatterContent = frontmatterContent.replace(
    /(".*?\[\[.*?\]\].*?")/g,
    (match) => {
      const key = `__WIKILINK_PROTECTED_${protectCounter++}__`
      protectedValues.set(key, match.slice(1, -1)) // Remove quotes
      return `"${key}"`
    }
  )
  
  // Also protect unquoted wikilinks that appear as scalar values
  // This handles cases like: project: [[Projects/MGDA]]
  frontmatterContent = frontmatterContent.replace(
    /(:\s*)(\[\[.*?\]\])/g,
    (match, prefix, wikilink) => {
      const key = `__WIKILINK_PROTECTED_${protectCounter++}__`
      protectedValues.set(key, wikilink)
      return `${prefix}"${key}"`
    }
  )
  
  // Reconstruct content with protected frontmatter
  const newFrontmatterBlock = `---\n${frontmatterContent}\n---`
  const newContent = content.replace(frontmatterBlock, newFrontmatterBlock)
  
  // Parse the (now protected) frontmatter
  let frontmatter: Record<string, any> | null = null
  try {
    frontmatter = yaml.load(frontmatterContent) as Record<string, any>
  } catch (e) {
    // Ignore parsing errors
  }
  
  return { frontmatter, content: newContent, protectedValues }
}

/**
 * Restore protected wikilinks in parsed data
 * In Nuxt Content v3, the afterParse hook receives:
 * - file.body: the raw markdown content (string)
 * - ctx.content: the parsed content object with frontmatter fields
 * We need to restore placeholders in both.
 */
function restoreFrontmatterWikilinks(data: any, protectedValues: Map<string, string>): void {
  if (!data || !protectedValues.size) return
  
  function restoreInValue(value: any): any {
    if (typeof value === 'string') {
      let result = value
      for (const [placeholder, original] of protectedValues) {
        result = result.replace(new RegExp(placeholder, 'g'), original)
      }
      return result
    }
    if (Array.isArray(value)) {
      return value.map(restoreInValue)
    }
    if (typeof value === 'object' && value !== null) {
      for (const key of Object.keys(value)) {
        value[key] = restoreInValue(value[key])
      }
    }
    return value
  }
  
  // Restore in all data properties
  for (const key of Object.keys(data)) {
    data[key] = restoreInValue(data[key])
  }
}

export default defineNuxtModule({
  meta: {
    name: 'obsidian-transform',
    configKey: 'obsidianTransform'
  },

  defaults: {
    // Enable/disable specific transformations
    wikilinks: true,
    embeds: true,
    callouts: true
  },

  async setup(options, nuxt) {
    // Detect SSG mode for memory optimization
    isSSGMode = process.env.NUXT_MODE === 'generate' || process.argv.includes('generate')
    if (isSSGMode) {
      console.log('[obsidian-transform] SSG mode detected - enabling memory optimizations')
    }

    const resolver = createResolver(import.meta.url)

    // Retrieve baseURL for path transformations
    const baseURL = nuxt.options.app.baseURL || '/'

    // Permalink map: filename (lowercase) → full path
    // Use a limited-size map to prevent unbounded growth
    // Exporting it for use in obsidian-graph
    
    // Shared state used from export - clear on setup
    extractedLinks.clear()
    permalinkMap.clear()


    const { readdir, mkdir, writeFile } = await import('fs/promises')
    const { join, resolve, dirname } = await import('path')

    // Prepare shadow assets directory
    // We use .nuxt/content-assets to separate them from build artifacts but keep them ephemeral
    const assetsDir = resolve(nuxt.options.rootDir, '.nuxt/content-assets')
    // Ensure clean state? No, just ensure it exists.
    // await rm(assetsDir, { recursive: true, force: true }).catch(() => {})
    await mkdir(assetsDir, { recursive: true })

    const roots = [
        resolve(nuxt.options.rootDir, 'vault'),
        resolve(nuxt.options.srcDir, 'content')
    ]

    for (const root of roots) {
        try {
            // Simple recursive walker
            async function walk(dir: string, base: string) {
                const entries = await readdir(dir, { withFileTypes: true })
                for (const entry of entries) {
                    const fullPath = join(dir, entry.name)
                    
                    // Skip common ignored directories and cloned repos
                    if (['.git', '.obsidian', '.trash', 'node_modules', '.nuxt', '.output', '.data', 'lithos', 'public'].includes(entry.name)) {
                        continue
                    }

                    if (entry.isDirectory()) {
                        await walk(fullPath, base)
                    } else if (entry.isFile()) {
                        const isMarkdown = entry.name.endsWith('.md')
                        const isImage = /\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)$/i.test(entry.name)
                        
                        // Debug log for images
                        if (isImage) console.log(`[obsidian-transform] Found image: ${entry.name}`)

                        if (isMarkdown || isImage) {
                         const relativePath = fullPath.replace(base + '/', '')
                         const filename = entry.name.replace(/\.md$/, '') 
                         
                         const key = isMarkdown ? filename.toLowerCase() : entry.name.toLowerCase()
                         permalinkMap.set(key, relativePath)
                         
                         if (isImage) {
                             console.log(`[obsidian-transform] Mapped image: ${key} -> ${relativePath}`)
                             
                             // Generate Shadow Markdown for Asset
                             // Preserves directory structure relative to assetsDir
                             const shadowPath = join(assetsDir, relativePath + '.md')
                             await mkdir(dirname(shadowPath), { recursive: true })
                             
                             const title = filename
                             // We point image to /_raw/... for rendering
                             const rawPath = '/_raw/' + relativePath
                             
                             const content = `---
title: "${title}"
description: "Asset: ${entry.name}"
image: "${rawPath}"
cover: "${rawPath}"
type: "asset"
extension: "${entry.name.split('.').pop()}"
_file: "${relativePath}"
---
`
                             await writeFile(shadowPath, content)
                         }

                         if (isMarkdown) {
                             const relativePathWithoutExt = relativePath.replace(/\.md$/, '')
                             permalinkMap.set(relativePathWithoutExt.toLowerCase(), relativePath)
                             
                             const clean = filename.replace(/^\d+\./, '').toLowerCase()
                             permalinkMap.set(clean, relativePath)
                             if (clean.includes('-')) permalinkMap.set(clean.replace(/-/g, ' '), relativePath)
                             
                             // Extract title and aliases from frontmatter for wikilink resolution
                             try {
                                 const { readFileSync } = await import('fs')
                                 const content = readFileSync(fullPath, 'utf8')
                                 const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
                                 if (fmMatch) {
                                     const fm = yaml.load(fmMatch[1]) as Record<string, any>
                                     if (fm?.title) {
                                         permalinkMap.set(fm.title.toLowerCase(), relativePath)
                                     }
                                     if (fm?.aliases && Array.isArray(fm.aliases)) {
                                         fm.aliases.forEach((alias: string) => {
                                             permalinkMap.set(alias.toLowerCase(), relativePath)
                                         })
                                     }
                                 }
                             } catch (e) {
                                 // Ignore frontmatter parsing errors
                             }
                         }
                        }
                    }
                }
            }
            console.log(`[obsidian-transform] Walking root: ${root}`)
            await walk(root, root)
            console.log(`[obsidian-transform] Walk complete. Map size: ${permalinkMap.size}`)
        } catch (e) {
            console.error(`[obsidian-transform] Walk failed for ${root}:`, e)
        }
    }
    
    // Configure Content Sources to include Shadow Assets
    // We must ensure the default source is also present if we override sources
    // @ts-ignore
    nuxt.options.content = nuxt.options.content || {}
    // @ts-ignore
    nuxt.options.content.sources = nuxt.options.content.sources || {}
    
    // Add default source if not exists (explicitly needed when defining sources)
    // @ts-ignore
    if (!nuxt.options.content.sources.content) {
        // @ts-ignore
        nuxt.options.content.sources.content = {
            driver: 'fs',
            base: resolve(nuxt.options.srcDir, 'content') // Use content dir
        }
    }
    
    // Add shadow assets source
    // @ts-ignore
    nuxt.options.content.sources.assets = {
        driver: 'fs',
        base: assetsDir
    }
    console.log('[obsidian-transform] Registered shadow assets source at:', assetsDir)

    // ============================================
    // HOOK: content:file:beforeParse
    // Transforms raw markdown before parsing
    // ============================================
    // @ts-ignore: Hook exists in Nuxt Content but types might be missing
    nuxt.hook('content:file:beforeParse', (ctx: any) => {
      const file = ctx.file

      // Check if this is a markdown file
      const ext = file.extension || file._extension || ''
      
      // STRICT FILTER: Ignore non-markdown and garbage files immediately
      // We also check for .lithosignore in the content root
      let ignoredSubstrings = [
        '/.git/', '/.obsidian/', '/.trash/', '/.data/', '/.claude/', '/node_modules/',
        '/Vault/Vault/', '/Academic/Academic/', // Circular symlink protection
        '/.DS_Store/',
        '/Template/' // Exclude Template folder usually? existing code didn't have it.
      ]
      
      let ignoredSegments: string[] = []
      
      try {
          // Attempt to read .lithosignore from content dir
          const { readFileSync, existsSync } = require('fs')
          const { join } = require('path')
          
          const cwdIgnorePath = join(process.cwd(), 'content', '.lithosignore')
          if (existsSync(cwdIgnorePath)) {
             const ignoreContent = readFileSync(cwdIgnorePath, 'utf8')
             const lines = ignoreContent.split('\n').map((l: string) => l.trim()).filter((l: string) => l && !l.startsWith('#'))
             ignoredSegments = lines
          }
      } catch (e) {}
      
      const filePathStr = file.path || file._file || ''
      const filePathSegments = filePathStr.split('/')
      
      // Update shared ref for other hooks (just approximate for regex)
      ignoredPatternsRef = [...ignoredSubstrings, ...ignoredSegments]


      // Check substrings
      if (ignoredSubstrings.some(p => filePathStr.includes(p))) {
        // console.log(`[obsidian-transform] Ignoring excluded path (substring): ${filePathStr}`)
        file.body = ''
        return
      }
      
      // Check segments (exact match required for directory or filename)
      if (ignoredSegments.some(s => filePathSegments.includes(s))) {
        // console.log(`[obsidian-transform] Ignoring excluded path (segment): ${filePathStr}`)
        file.body = ''
        return
      }

      // Check wildcards in segments? (Simple glob support if needed)
      // For now, assume .lithosignore contains exact names.

      if (ext !== '.md' && ext !== 'md') return

      const filePath = file.path || file._file || ''
      
      let content = file.body
      if (!content || typeof content !== 'string') return

      // 0. Protect wikilinks in frontmatter from MDC transformation
      // MDC transforms [[...]] to HTML in ALL string values including frontmatter
      // This causes "(truncated link)" issues in PropertiesPanel
      // We protect them here and unprotect in afterParse
      const { frontmatter: rawFrontmatter, content: contentWithoutFm, protectedValues } = protectFrontmatterWikilinks(content)
      content = contentWithoutFm
      
      // Store protected values for restoration in afterParse
      // Use the original file path as key and store it in a property that won't be modified
      const fileId = filePathStr
      if (protectedValues.size > 0 && fileId) {
        protectedFrontmatterMap.set(fileId, protectedValues)
        // Store the original path in a custom property so afterParse can find it
        // even if file.path is transformed by other modules (e.g., daily-notes)
        file._originalFilePath = fileId
      }

      // 1. Extract wikilinks for graph before any transformation
      // In SSG mode, limit extractedLinks size to prevent memory bloat
      if (filePath) {
        try {
          const links = extractWikilinkTargets(content)
          if (links.length > 0) {
            // Limit stored links in SSG mode
            if (isSSGMode && extractedLinks.size >= MAX_EXTRACTED_LINKS) {
              // Delete oldest entries if over limit
              const keys = Array.from(extractedLinks.keys())
              for (let i = 0; i < 100 && keys[i]; i++) {
                extractedLinks.delete(keys[i])
              }
            }
            extractedLinks.set(filePath, links)
            
            // ATTACH LINKS TO FILE OBJECT FOR NUXT CONTENT INDEXING
            // This allows us to query 'links' in the graph handler
            file.links = links
          }
        } catch (e) {
             // console.warn(`[obsidian-transform] Failed to extract links from ${filePath}:`, e)
        }
      }

      // 2a. Transform ABC notation FIRST (before code block protection)
      try {
        content = transformAbcNotation(content)
      } catch (e) {
        console.warn(`[obsidian-transform] Failed to transform ABC notation in ${filePath}:`, e)
      }

      // 2b. Transform Inline Bases FIRST (before code block protection)
      try {
        content = transformInlineBases(content)
      } catch (e) {
        console.warn(`[obsidian-transform] Failed to transform inline bases in ${filePath}:`, e)
      }

      // 3. Protect code blocks from transformation
      const { text: unprotected, restore } = protectCodeBlocks(content)
      content = unprotected

      // 4. Transform Embeds
      if (options.embeds) {
        try {
          content = transformEmbeds(content, permalinkMap, baseURL)
        } catch (e) {
          console.warn(`[obsidian-transform] Failed to transform embeds in ${filePath}:`, e)
        }
      }

      // 5. Transform Wikilinks
      if (options.wikilinks) {
        try {
          content = transformWikilinks(content, permalinkMap, baseURL)
        } catch (e) {
          console.warn(`[obsidian-transform] Failed to transform wikilinks in ${filePath}:`, e)
        }
      }

      // 6. Transform Callouts
      if (options.callouts) {
        try {
          content = transformCallouts(content)
        } catch (e) {
          console.warn(`[obsidian-transform] Failed to transform callouts in ${filePath}:`, e)
        }
      }

      // 7. Rewrite relative asset paths in inline HTML
      // Transform: <img src="Assets/..." -> <img src="/_raw/Assets/...
      try {
        content = transformHtmlAssetPaths(content, baseURL)
      } catch (e) {
        console.warn(`[obsidian-transform] Failed to transform HTML asset paths in ${filePath}:`, e)
      }

      // 8. (Inline Bases moved up)

      // 9. Strip First H1 (Duplicate Title Fix)
      // Titles come from frontmatter, so strip any leading H1 unconditionally
      try {
        content = content.replace(/^#\s+[^\n]+\n+/, '')
      } catch (e) {}
      

      // 10. Restore code blocks
      content = restore(content)

      file.body = content
    })

    // ============================================
    // HOOK: content:file:afterParse
    // ============================================
    // HOOK: content:file:afterParse
    // ============================================
    // @ts-ignore
    nuxt.hook('content:file:afterParse', (ctx: any) => {
      const file = ctx.file
      const content = ctx.content // This contains the parsed frontmatter!
      // console.log('[obsidian-transform] afterParse:', file._id)
      const ext = file.extension || file._extension || ''
      if (ext !== '.md' && ext !== 'md') return

      const filePath = file.path || file._path || ''
      
      // Restore protected frontmatter wikilinks
      // Use _originalFilePath if available (set in beforeParse), otherwise fall back to current path
      const fileId = file._originalFilePath || filePath
      const protectedValues = protectedFrontmatterMap.get(fileId)
      if (protectedValues && protectedValues.size > 0) {
        // Restore in the parsed content object (contains frontmatter fields)
        restoreFrontmatterWikilinks(content, protectedValues)
        // Also restore in the file body for completeness
        restoreFrontmatterWikilinks(file, protectedValues)
        protectedFrontmatterMap.delete(fileId) // Clean up
      }
      
      // Filter ignored files if they slipped through
      if (filePath && ignoredPatternsRef.some(p => {
          if (p.includes('/')) return filePath.includes(p)
          return filePath.split('/').includes(p)
      })) {
         console.log(`[obsidian-transform] Force removing ignored file in afterParse: ${filePath}`)
         file._ignore = true 
         file.draft = true
         file.navigation = false // Explicitly hide from navigation
         // Also try setting hidden property which some themes use
         file.hidden = true
         return
      }

      const pathParts = filePath.split('/')
      const filename = pathParts[pathParts.length - 1]?.replace(/\.md$/, '') || ''

      if (filename && filePath) {
        permalinkMap.set(filename.toLowerCase(), filePath)
        const cleanFilename = filename.replace(/^\d+\./, '').toLowerCase()
        permalinkMap.set(cleanFilename, filePath)
        if (cleanFilename.includes('-')) {
             permalinkMap.set(cleanFilename.replace(/-/g, ' '), filePath)
        }

        const title = file.title || file.data?.title
        if (title) {
          permalinkMap.set(title.toLowerCase(), filePath)
        }

        const aliases = file.aliases || file.data?.aliases
        if (aliases && Array.isArray(aliases)) {
          aliases.forEach((alias: string) => {
            permalinkMap.set(alias.toLowerCase(), filePath)
          })
        }
      }
    })
    
    // ============================================
    // HOOK: content:file:beforeInsert
    // ============================================
    // @ts-ignore
    nuxt.hook('content:file:beforeInsert', (doc: any) => {
       // console.log('[obsidian-transform] beforeInsert:', doc._id)
       const filePath = doc._source || doc._file || doc.path || ''
       
       // STRICT FILTER
       if (filePath && ignoredPatternsRef.some(p => {
           if (p.includes('/')) return filePath.includes(p)
           return filePath.split('/').includes(p)
       })) {
           console.log(`[obsidian-transform] BLOCKING ignored file in beforeInsert: ${doc._id} (${filePath})`)
           doc._ignore = true
           doc.draft = true // Hide from query?
           // Nuxt Content doesn't have a standardized "drop" in beforeInsert I think,
           // but marking it draft usually hides it in prod, maybe not dev.
           // Setting _id to something invalid might break it?
           // doc._id = 'ignored:' + doc._id
       }
    })

    nuxt.hook('ready', async () => {
      const { writeFile, mkdir } = await import('fs/promises')
      const { join } = await import('path')

      const linksData: Record<string, string[]> = {}
      for (const [path, links] of extractedLinks) {
        linksData[path] = links
      }

      const outputPath = join(nuxt.options.rootDir, '.nuxt/extracted-links.json')
      await mkdir(join(nuxt.options.rootDir, '.nuxt'), { recursive: true })
      await writeFile(outputPath, JSON.stringify(linksData, null, 2))
    })
  }
})

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * MDC Attribute escaping helper
 */
function escapeMdcAttr(val: string): string {
  if (!val) return ''
  // Nuxt Content attributes use " as delimiter, escape existing " and handle whitespace
  return val.replace(/"/g, '&quot;')
}

function extractWikilinkTargets(content: string): string[] {
  const targets: string[] = []
  
  // 1. Wikilinks [[Target]]
  const wikilinkRegex = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g
  let match
  while ((match = wikilinkRegex.exec(content)) !== null) {
    targets.push(match[1].trim())
  }
  
  // 2. Standard Markdown Links [Label](Target)
  // Exclude external links and anchors
  const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const target = match[2].trim()
    if (!target.startsWith('http') && !target.startsWith('//') && !target.startsWith('#') && !target.startsWith('mailto:')) {
      // Remove anchor if present
      const cleanTarget = target.split('#')[0]
      if (cleanTarget) {
         // Remove extension .md
         targets.push(cleanTarget.replace(/\.md$/i, ''))
      }
    }
  }
  
  return targets
}

function transformWikilinks(content: string, permalinkMap: Map<string, string>, baseURL: string = '/'): string {
  const wikilinkRegex = /\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g
  
  // Helper to join paths with baseURL
  const withBase = (path: string) => {
    if (baseURL === '/') return path
    return `${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }

  return content.replace(wikilinkRegex, (match, target, section, alias) => {
    const targetLower = target.trim().toLowerCase()
    let href = ''
    const mappedPath = permalinkMap.get(targetLower)
    
    if (mappedPath) {
       // Clean the path: remove mount prefixes and extension
       let clean = mappedPath
         .replace(/^(vault|content|docs)[:/]/i, '')
         .replace(/\.md$/i, '')
       
       const parts = clean.split(/[/\\]/)
       const cleanParts = parts.map(p => p.replace(/^\d+\./, '').toLowerCase())
       href = withBase('/' + cleanParts.filter(Boolean).join('/'))
    } else {
       // Fallback: Preserves slashes for path-based links
       const parts = target.trim().split(/[/\\]/)
       const cleanParts = parts.map((p: string) => p.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]/g, ''))
       href = withBase('/' + cleanParts.filter(Boolean).join('/'))
    }

    if (section) {
      const sectionSlug = section.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      href += `#${sectionSlug}`
    }

    const displayText = alias?.trim() || target.trim()
    return `<a href="${href}" class="internal-link">${displayText}</a>`
  })
}

function transformEmbeds(content: string, permalinkMap: Map<string, string>, baseURL: string = '/'): string {
  const embedRegex = /!\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/g
  
  // Helper to join paths with baseURL
  const withBase = (path: string) => {
    if (baseURL === '/') return path
    return `${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }

  return content.replace(embedRegex, (match, target, section, alias) => {
    const targetTrimmed = target.trim()
    
    // Check if target is an image
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico']
    const isImage = imageExtensions.some(ext => targetTrimmed.toLowerCase().endsWith(ext))

    if (isImage) {
        const alt = alias ? alias.trim() : targetTrimmed
        let src = targetTrimmed

        // Resolve path from permalinkMap
        const mappedPath = permalinkMap.get(targetTrimmed.toLowerCase())
        if (mappedPath) {
             // mappedPath is relative to vault root e.g. "Assets/Avatar1.jpeg"
             // We need to match what transformHtmlAssetPaths expects OR just provide the full raw path
             // transformHtmlAssetPaths expects relative or absolute.
             // If we give it "/_raw/Assets/Avatar1.jpeg", it will skip it (correctly).
             // So let's output the full correct path.
             src = withBase('/_raw/' + mappedPath)
        } else {
             // Fallback to name, let transformHtmlAssetPaths try (though it handles relative)
             console.warn(`[obsidian-transform] Image not found in map: ${targetTrimmed}`)
        }
        
        return `<img src="${src}" alt="${escapeMdcAttr(alt)}" />`
    }

    const attrs = [`src="${escapeMdcAttr(targetTrimmed)}"`]
    if (section) attrs.push(`section="${escapeMdcAttr(section.trim())}"`)
    if (alias) attrs.push(`alias="${escapeMdcAttr(alias.trim())}"`)
    return `\n\n::note-embed{${attrs.join(' ')}}\n::\n\n`
  })
}

function transformCallouts(content: string): string {
  const lines = content.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    // Match callout header: > [!type] title
    // Careful with regex, keep it simple
    const headerMatch = line.match(/^([ \t]*)(>)\s*\[!(\w+)\]([+-]?)[ ]*(.*?)$/)

    if (headerMatch) {
      const [_, indent, prefix, type, foldState, title] = headerMatch
      const mdcType = mapCalloutType(type)
      const collapsed = foldState === '-' ? ' collapsed="true"' : ''
      const titleContent = title.trim() || capitalizeFirst(type)
      
      const bodyLines: string[] = []
      i++ // Move to next line
      
      // Consume body lines (starting with >)
      while (i < lines.length) {
        const nextLine = lines[i]
        // Check if line continues the callout (allows for some indentation flexibility)
        // Must start with same indent (roughly) + >
        // For simplicity, we just check if it looks like a quote block line
        const bodyMatch = nextLine.match(/^[ \t]*>[ ]?(.*)$/)
        
        if (bodyMatch) {
            bodyLines.push(bodyMatch[1]) // Content after '>'
            i++
        } else {
            break // End of callout
        }
      }
      
      // Construct MDC component
      result.push(`${indent}::obsidian-callout{type="${mdcType}"${collapsed}}`)
      // Add body
      if (bodyLines.length > 0) {
        result.push(bodyLines.map(l => `${indent}${l}`).join('\n'))
      }
      // Add title slot
      result.push('')
      result.push(`${indent}#title`)
      result.push(`${indent}${titleContent}`)
      result.push(`${indent}::`)
      
    } else {
      result.push(line)
      i++
    }
  }
  
  return result.join('\n')
}

function mapCalloutType(obsidianType: string): string {
  const typeMap: Record<string, string> = {
    note: 'note', tip: 'tip', hint: 'tip', important: 'warning', warning: 'warning', caution: 'caution', danger: 'caution',
    info: 'note', success: 'tip', check: 'tip', done: 'tip', question: 'note', help: 'note', faq: 'note',
    attention: 'warning', failure: 'caution', fail: 'caution', error: 'caution', bug: 'caution',
    example: 'note', quote: 'note', cite: 'note', abstract: 'note', summary: 'note', tldr: 'note'
  }
  return typeMap[obsidianType.toLowerCase()] || 'note'
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function transformInlineBases(content: string): string {
  const baseBlockRegex = /```base\n([\s\S]*?)```/g
  return content.replace(baseBlockRegex, (match, yamlContent) => {
    try {
      const config = parseBaseYaml(yamlContent.trim())
      // Use base64 encoding to avoid MDC attribute quoting issues.
      // Filter expressions contain double quotes (e.g. file.inFolder("Assets"))
      // which break JSON-in-attribute parsing regardless of quote style.
      const configJson = JSON.stringify(config)
      const configBase64 = Buffer.from(configJson).toString('base64')
      return `::obsidian-base{configBase64="${configBase64}"}\n::`
    } catch (e) {
      return match
    }
  })
}

function transformAbcNotation(content: string): string {
  // console.log('[obsidian-transform] Running transformAbcNotation')
  const abcBlockRegex = /(?:^|\n) *```(?:music-)?abc\s*\n([\s\S]*?)```/g
  return content.replace(abcBlockRegex, (match, abcContent) => {
    // console.log('[obsidian-transform] Found ABC block!')
    const encodedCode = Buffer.from(abcContent.trim()).toString('base64')
    return `\n::abc-music{code="${encodedCode}"}\n::`
  })
}

/**
 * Transform relative asset paths in inline HTML to use /_raw/ prefix.
 * This ensures images and other assets in HTML tags are served from the vault copy.
 * 
 * Examples:
 * - <img src="Assets/avatar.jpg"> → <img src="/_raw/Assets/avatar.jpg">
 * - <img src="./image.png"> → <img src="/_raw/image.png">
 * - <source src="video.mp4"> → <source src="/_raw/video.mp4">
 * 
 * Excludes external URLs (http://, https://, //, data:, blob:)
 */
function transformHtmlAssetPaths(content: string, baseURL: string = '/'): string {
  // Match src attributes in img, video, source, embed, audio tags
  const srcAttrRegex = /<(img|video|source|embed|audio|picture)([^>]*?)src\s*=\s*["']([^"']+)["']([^>]*?)>/gi
  
  // Helper to join paths with baseURL
  const withBase = (path: string) => {
    if (baseURL === '/') return path
    return `${baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }

  return content.replace(srcAttrRegex, (match, tag, before, srcValue, after) => {
    // Skip external URLs and absolute paths that don't need raw prefix
    if (srcValue.startsWith('http://') ||
        srcValue.startsWith('https://') ||
        srcValue.startsWith('//') ||
        srcValue.startsWith('data:') ||
        srcValue.startsWith('blob:') ||
        srcValue.startsWith('/_raw/') ||
        srcValue.startsWith('/_nuxt/') ||
        srcValue.startsWith('/_fonts/')) {
      
      // Even for these, if it starts with /_raw we might need to prepend baseURL if it's not already there
      if (srcValue.startsWith('/_raw/') && baseURL !== '/') {
        const cleanBase = baseURL.replace(/\/$/, '')
        if (!srcValue.startsWith(cleanBase)) {
           const newSrc = withBase(srcValue)
           return `<${tag}${before}src="${newSrc}"${after}>`
        }
      }
      
      return match
    }
    
    // Skip absolute paths that start with / but aren't expected to be raw
    if (srcValue.startsWith('/') && !srcValue.startsWith('/_raw')) {
      // Could be a public asset - leave as is (or prepend baseURL if missing)
      const cleanBase = baseURL.replace(/\/$/, '')
      if (baseURL !== '/' && !srcValue.startsWith(cleanBase)) {
        const newSrc = withBase(srcValue)
        return `<${tag}${before}src="${newSrc}"${after}>`
      }
      return match
    }
    
    // Rewrite relative paths to use /_raw/
    let newSrc = srcValue
    if (srcValue.startsWith('./')) {
      newSrc = withBase('/_raw/' + srcValue.substring(2))
    } else {
      newSrc = withBase('/_raw/' + srcValue)
    }
    
    return `<${tag}${before}src="${newSrc}"${after}>`
  })
}

function parseBaseYaml(yamlContent: string): any {
  const parsed = yaml.load(yamlContent) as any
  if (!parsed || typeof parsed !== 'object') return { views: [{ type: 'table', name: 'Table' }] }
  const config: any = { views: [] }
  if (parsed.name) config.name = parsed.name
  if (parsed.folder || parsed.path) config.source = parsed.folder || parsed.path
  if (typeof parsed.sort === 'string') {
    const [prop, dir] = parsed.sort.split(' ')
    // Support separate 'order' key for direction (e.g., sort: date, order: desc)
    const explicitDir = dir || parsed.order
    config.defaultSort = [{ property: prop, direction: explicitDir?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC' }]
  }
  if (typeof parsed.columns === 'string') config.defaultOrder = parsed.columns.split(',').map((c: string) => c.trim())
  if (parsed.limit) config.limit = parseInt(parsed.limit, 10)
  if (typeof parsed.filter === 'string') config.filterExpr = parsed.filter
  if (parsed.filters) config.filters = parsed.filters
  if (Array.isArray(parsed.views)) {
    config.views = parsed.views.map((view: any) => {
      const normalized: any = { ...view }
      if (!normalized.sort && config.defaultSort) normalized.sort = config.defaultSort
      if (!normalized.order && config.defaultOrder) normalized.order = config.defaultOrder
      if (!normalized.limit && config.limit) normalized.limit = config.limit
      return normalized
    })
  } else {
    config.views = [{ type: 'table', name: 'Table', sort: config.defaultSort, order: config.defaultOrder, limit: config.limit }]
  }
  if (config.filters && config.views.length > 0 && !config.views[0].filters) config.views[0].filters = config.filters
  return config
}

/**
 * Protect code blocks from Obsidian transforms.
 * Memory-optimized version: uses array instead of Map to reduce object overhead.
 * Clears references after restoration to help GC.
 */
function protectCodeBlocks(content: string): { text: string; restore: (t: string) => string } {
  // Use array instead of Map for lower memory overhead
  const placeholders: [string, string][] = []
  let counter = 0

  function placeholder(original: string): string {
    const key = `\x00CODE_${counter++}\x00`
    placeholders.push([key, original])
    return key
  }

  // 1. Replace fenced code blocks
  let result = content.replace(/^(`{3,}|~{3,})([^\n]*)\n[\s\S]*?^\1/gm, (m) => placeholder(m))
  // 2. Replace inline code
  result = result.replace(/`{1,3}[^`\n]+`{1,3}/g, (m) => placeholder(m))

  return {
    text: result,
    restore(transformed: string): string {
      if (placeholders.length === 0) return transformed
      
      // Simple direct replacement - more memory efficient for small numbers of blocks
      let output = transformed
      for (const [key, original] of placeholders) {
        output = output.split(key).join(original)
      }
      
      // Clear array to help GC
      placeholders.length = 0
      
      return output
    }
  }
}
