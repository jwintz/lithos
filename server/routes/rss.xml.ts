/**
 * RSS Feed Handler
 *
 * Generates RSS 2.0 feed with configurable content types
 * Configuration: app.config.ts -> rss
 */
import { defineEventHandler, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  // Get RSS config from app.config
  const appConfig = useAppConfig()
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

  // Site configuration
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://example.com'
  const siteTitle = rssConfig.title || 'Lithos Journal'
  const siteDescription = rssConfig.description || 'Daily notes from the vault'

  // Generate RSS items
  const items = posts.map(post => {
    const date = post.date || post.meta?.date
    const pubDate = date ? new Date(date).toUTCString() : new Date().toUTCString()
    const link = `${siteUrl}${post.path}`

    return `    <item>
      <title><![CDATA[${post.title || 'Untitled'}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.description || ''}]]></description>
    </item>`
  }).join('\n')

  // Build RSS document
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteTitle}</title>
    <link>${siteUrl}</link>
    <description>${siteDescription}</description>
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
