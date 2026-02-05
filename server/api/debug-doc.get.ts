// Test extracting text from Nuxt Content v3 compact AST
function extractFromCompactAst(nodes: any[]): string {
  if (!Array.isArray(nodes)) return ''

  return nodes.map(node => {
    if (typeof node === 'string') return node

    if (Array.isArray(node) && node.length >= 1) {
      const [tag, attrs, ...children] = node
      if (tag === 'img' || tag === 'video' || tag === 'audio') return ''

      const childText = children
        .map((child: any) => {
          if (typeof child === 'string') return child
          if (Array.isArray(child)) return extractFromCompactAst([child])
          return ''
        })
        .join('')

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
  const docs = await queryCollection(event, 'docs').all()
  const post = docs.find(d => d.path?.includes('introducing-lithos'))
  if (post) {
    return {
      path: post.path,
      title: post.title,
      projectFull: (post as any).project,
      projectLength: (post as any).project?.length
    }
  }
  return { error: 'Post not found', totalDocs: docs.length }
})
