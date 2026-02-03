import { defineNuxtModule } from '@nuxt/kit'

/**
 * Obsidian Ordering Module
 * 
 * Allows Obsidian notes to be ordered via frontmatter 'order' or 'weight' properties,
 * overriding the default alphabetical or file-system ordering.
 * 
 * In Nuxt Content v3, the hook receives { file, content, collection } where:
 * - file: raw file info
 * - content: parsed content with frontmatter properties
 * - collection: the collection name
 */
export default defineNuxtModule({
  meta: {
    name: 'obsidian-ordering',
    configKey: 'obsidianOrdering'
  },

  setup(options, nuxt) {
    nuxt.hook('content:file:afterParse', (ctx) => {
      // Nuxt Content v3 passes { file, content, collection }
      const content = ctx.content || ctx
      
      // Get order value from frontmatter
      let orderVal = undefined
      if (content.order !== undefined) {
        orderVal = typeof content.order === 'number' ? content.order : parseFloat(content.order)
      } else if (content.weight !== undefined) {
        orderVal = typeof content.weight === 'number' ? content.weight : parseFloat(content.weight)
      }

      if (orderVal !== undefined && !isNaN(orderVal)) {
        // Ensure navigation object exists
        content.navigation = content.navigation || {}
        
        // Set navigation.order if not already set
        if (content.navigation.order === undefined) {
          content.navigation.order = orderVal
        }
      }
    })
  }
})
