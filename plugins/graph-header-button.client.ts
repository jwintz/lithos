/**
 * Client plugin to add graph button to header on tablet/mobile
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Only run on client
  if (import.meta.server) return

  nuxtApp.hook('app:mounted', () => {
    addGraphButton()
    
    // Re-add on navigation (for SPA navigation)
    nuxtApp.hook('page:finish', () => {
      setTimeout(addGraphButton, 100)
    })
  })
})

function addGraphButton() {
  // Check if button already exists
  if (document.getElementById('header-graph-btn')) return
  
  // Find the color mode button in header
  const colorModeBtn = document.querySelector('header button[aria-label*="mode"], header button[aria-label*="Switch"]')
  if (!colorModeBtn) return
  
  // Create graph button
  const graphBtn = document.createElement('button')
  graphBtn.id = 'header-graph-btn'
  graphBtn.className = colorModeBtn.className + ' lg:hidden'
  graphBtn.setAttribute('aria-label', 'Open Graph')
  graphBtn.innerHTML = `<svg class="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`
  
  graphBtn.addEventListener('click', () => {
    // Dispatch custom event to open graph modal
    window.dispatchEvent(new CustomEvent('lithos:open-graph-modal'))
  })
  
  // Insert after color mode button
  colorModeBtn.parentNode?.insertBefore(graphBtn, colorModeBtn.nextSibling)
}
