export default defineEventHandler(async (event) => {
  const docs = await queryCollection(event, 'docs').all()
  // Find notes with show tag
  const shows = docs.filter(d => {
    const tags = (d as any).tags || (d as any).meta?.tags || []
    return Array.isArray(tags) && tags.includes('show')
  })
  return {
    totalDocs: docs.length,
    showCount: shows.length,
    shows: shows.map(s => ({
      path: s.path,
      title: s.title,
      tags: (s as any).tags || (s as any).meta?.tags || []
    }))
  }
})
