export default defineEventHandler(async (event) => {
  const docs = await queryCollection(event, 'docs').all()
  // Find a note with project tag
  const project = docs.find(d => {
    const tags = (d as any).tags || (d as any).meta?.tags || []
    return Array.isArray(tags) && tags.includes('project')
  })
  if (project) {
    return {
      path: project.path,
      title: project.title,
      topLevelKeys: Object.keys(project),
      metaKeys: project.meta ? Object.keys(project.meta) : [],
      meta: project.meta,
      hasMtime: 'mtime' in project || (project.meta && 'mtime' in project.meta),
      _mtime: (project as any)._mtime,
      mtime: (project as any).mtime
    }
  }
  return { error: 'No project found', totalDocs: docs.length }
})
