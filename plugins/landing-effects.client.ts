/**
 * Landing Page Effects Plugin
 * 
 * Injects SVG duotone filters into the DOM and manages the landing-page class
 * for the home route. Client-side only since we need DOM access.
 */

export default defineNuxtPlugin((nuxtApp) => {
  // Inject SVG filters once on initial load
  const injectSvgFilters = () => {
    // Check if already injected
    if (document.getElementById('lithos-duotone-light')) return

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('class', 'lithos-svg-filters')
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    svg.style.cssText = 'width: 0; height: 0; position: absolute; pointer-events: none;'

    svg.innerHTML = `
      <defs>
        <!-- Dark Mode Filter: Black -> Violet duotone -->
        <filter id="lithos-duotone-dark">
          <feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0" />
          <feComponentTransfer color-interpolation-filters="sRGB">
            <feFuncR type="table" tableValues="0 0.54"/>
            <feFuncG type="table" tableValues="0 0.36"/>
            <feFuncB type="table" tableValues="0 0.96"/>
          </feComponentTransfer>
        </filter>

        <!-- Light Mode Filter: Deep Violet -> White duotone -->
        <filter id="lithos-duotone-light">
          <feColorMatrix type="matrix" values=".33 .33 .33 0 0 .33 .33 .33 0 0 .33 .33 .33 0 0 0 0 0 1 0" />
          <feComponentTransfer color-interpolation-filters="sRGB">
            <feFuncR type="table" tableValues="0.3 1"/>
            <feFuncG type="table" tableValues="0.1 1"/>
            <feFuncB type="table" tableValues="0.6 1"/>
          </feComponentTransfer>
        </filter>
      </defs>
    `

    document.body.appendChild(svg)
  }

  // Toggle landing-page class based on route
  const updateLandingClass = (path: string) => {
    const isLanding = path === '/' || path === ''
    // Use #__nuxt as the wrapper since Docus doesn't use a main element on landing
    const wrapper = document.getElementById('__nuxt')
    
    if (wrapper) {
      if (isLanding) {
        wrapper.classList.add('landing-page')
      } else {
        wrapper.classList.remove('landing-page')
      }
    }
  }

  // Initialize on app mounted
  nuxtApp.hook('app:mounted', () => {
    injectSvgFilters()
    updateLandingClass(useRoute().path)
  })

  // Update class on route change
  nuxtApp.hook('page:finish', () => {
    updateLandingClass(useRoute().path)
  })
})
