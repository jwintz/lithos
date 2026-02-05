/**
 * RSS Feed Handler
 *
 * Generates RSS 2.0 feed with configurable content types
 * Configuration: app.config.ts -> rss
 * Site name: runtimeConfig.public.siteName
 */
import { defineEventHandler, setHeader, getRequestURL } from 'h3'

/**
 * Escape XML special characters in content
 */
function escapeXml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * Convert Nuxt Content v3 body to plain text for RSS content
 *
 * Body structure in Nuxt Content v3:
 * - body.type: 'minimark' (or 'root')
 * - body.value: Array of compact AST nodes
 *   - Each node: ["tag", {attrs}, ...children] or just "text string"
 * - body.toc: Table of contents
 */
function astToText(node: any): string {
  if (!node) return ''

  // Plain string
  if (typeof node === 'string') return node

  // Nuxt Content v3 body object with value array
  if (node.value && Array.isArray(node.value)) {
    return extractFromCompactAst(node.value)
  }

  // Direct array
  if (Array.isArray(node)) {
    return extractFromCompactAst(node)
  }

  return ''
}

/**
 * Extract text from Nuxt Content v3 compact AST format
 * Format: ["tag", {attrs}, child1, child2, ...] or just "text"
 */
function extractFromCompactAst(nodes: any[]): string {
  if (!Array.isArray(nodes)) return ''

  return nodes.map(node => {
    // Plain text string
    if (typeof node === 'string') return node

    // Compact AST node: ["tag", {attrs}, ...children]
    if (Array.isArray(node) && node.length >= 1) {
      const [tag, attrs, ...children] = node

      // Skip images and other non-text elements
      if (tag === 'img' || tag === 'video' || tag === 'audio') return ''

      // Extract text from children
      const childText = children
        .map((child: any) => {
          if (typeof child === 'string') return child
          if (Array.isArray(child)) return extractFromCompactAst([child])
          return ''
        })
        .join('')

      // Add spacing for block elements
      const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'div']
      if (blockTags.includes(tag)) {
        return childText.trim() + '\n\n'
      }
      if (tag === 'br') return '\n'

      return childText
    }

    return ''
  }).join('').trim()
}

export default defineEventHandler(async (event) => {
  // Get RSS config from app.config and runtime config
  const appConfig = useAppConfig()
  const runtimeConfig = useRuntimeConfig()
  const rssConfig = appConfig.rss || {}

  // If RSS is disabled, return empty feed
  if (rssConfig.enabled === false) {
    setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
    return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Feed Disabled</title></channel></rss>'
  }

  // Query all docs
  let posts: any[] = []
  try {
    const allDocs = await queryCollection(event, 'docs').all()

    // Content type patterns and checks
    const contentTypes = rssConfig.contentTypes || ['daily-note', 'post']
    const dailyNotePattern = /\/daily-notes\/\d{4}\/\d{2}\/\d{2}$/
    const filterPublished = rssConfig.filterPublished ?? true

    posts = allDocs
      .filter((doc: any) => {
        // Check published status if filtering enabled
        if (filterPublished) {
          const status = doc.status || doc.meta?.status
          if (status && status !== 'published') return false
        }

        // Check content types
        const docType = doc.type || doc.meta?.type

        // Check if doc type matches any configured content type
        if (docType && contentTypes.includes(docType)) return true

        // Check isDailyNote flag
        if (contentTypes.includes('daily-note')) {
          if (doc.isDailyNote === true) return true
          if (doc.meta?.isDailyNote === true) return true
          if (doc.path && dailyNotePattern.test(doc.path)) return true
        }

        // Check for blog posts by path
        if (contentTypes.includes('post')) {
          if (doc.path?.startsWith('/blog/')) return true
        }

        return false
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.meta?.date || 0).getTime()
        const dateB = new Date(b.date || b.meta?.date || 0).getTime()
        return dateB - dateA
      })
      .slice(0, rssConfig.maxItems || 20)
  } catch (e) {
    console.error('[rss] Error querying posts:', e)
    posts = []
  }

  // Site configuration - prefer runtimeConfig values
  const baseURL = runtimeConfig.app.baseURL || '/'
  // Site URL: check env var, then runtimeConfig, then construct from request
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL ||
                  (runtimeConfig.public?.siteUrl as string) ||
                  (runtimeConfig.public?.siteURL as string) ||
                  getRequestURL(event).origin ||
                  'https://example.com'
  const siteName = (runtimeConfig.public?.siteName as string) ||
                   (runtimeConfig.public?.vaultName as string) ||
                   'Lithos'
  // Use siteName if rss.title is the default "Lithos Journal", otherwise use configured title
  const siteTitle = (rssConfig.title && rssConfig.title !== 'Lithos Journal') ? rssConfig.title : siteName
  const siteDescription = rssConfig.description || `Posts and notes from ${siteName}`

  // Generate RSS items with full content
  const items = posts.map(post => {
    const date = post.date || post.meta?.date
    const pubDate = date ? new Date(date).toUTCString() : new Date().toUTCString()

    // Build link with baseURL support
    const postPath = post.path || ''
    const link = `${siteUrl}${baseURL === '/' ? '' : baseURL.replace(/\/$/, '')}${postPath}`

    // Extract content from body AST
    let content = ''
    if (post.body) {
      content = astToText(post.body).trim()
    }

    // Fall back to description if no body content extracted
    const description = post.description || post.meta?.description || ''
    const itemContent = content || description

    // Build item with content:encoded for full content
    return `    <item>
      <title><![CDATA[${post.title || 'Untitled'}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      <content:encoded><![CDATA[${itemContent}]]></content:encoded>
    </item>`
  }).join('\n')

  // Build RSS document with content namespace
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  // Set content type
  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')

  return rss
})
