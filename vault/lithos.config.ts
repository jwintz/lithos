export default {
  site: {
    name: 'Lithos',
    description: 'Turn your Obsidian Vault into a beautiful documentation website.'
  },
  theme: {
    // Custom font configuration
    fonts: {
      sans: "'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      mono: "'SF Mono', 'Cascadia Code', 'Fira Code', ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace"
    },
    // Primary color palette (Lithos Violet)
    colors: {
      primary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
        950: '#2e1065'
      }
    },
    // Image treatment settings
    images: {
      noir: {
        enabled: true,
        grayscale: 100,
        contrast: 110,
        hoverRestore: true
      },
      scanlines: {
        enabled: true,
        opacity: 0.02
      },
      vignette: {
        enabled: true,
        opacity: 0.3
      }
    },
    // Fine-grained typography adjustments
    typography: {
      headingTracking: '-0.01em',
      bodyTracking: '0',
      codeTracking: '0'
    }
  }
}
