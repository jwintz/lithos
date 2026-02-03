export default defineEventHandler(async (event) => {
  const docs = await queryCollection(event, 'docs').select('path', 'title', 'order').order('order', 'ASC').all()
  const nav = await queryCollectionNavigation(event, 'docs')
  return { docs, nav }
})
