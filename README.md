# Lithos

> Transform your Obsidian vault into a beautiful documentation site

Lithos extends [Docus v5](https://docus.dev) to support Obsidian-specific features like wikilinks, callouts, and YAML frontmatter.

## ✨ Features

- 📝 **Obsidian Syntax** - First-class support for Wikilinks `[[Page]]`, Embeds `![[Note]]`, and Callouts `> [!note]`
- 🕸️ **Graph View** - Interactive force-directed graph (Global & Local)
- 📊 **Data Views** - "Bases" for structured data (Tables, Cards, Lists) from frontmatter
- 🎵 **Rich Media** - ABC Music Notation and Mermaid Diagrams support
- 🎨 **Beautiful Design** - Powered by Docus v5 and Nuxt UI with "Native Clarity" theme
- 📱 **Responsive** - Mobile-first responsive design
- 🌙 **Dark Mode** - Built-in dark/light mode support
- 🔍 **Full-text Search** - Search across all your notes
- 🔗 **Auto Navigation** - Sidebar generated from folder structure
- ⚡ **Fast** - Optimized for performance with Nuxt 4 & Static Site Generation
- 🤖 **AI-Ready** - Agentic Skills system and LLM integration (see [AGENTS.md](AGENTS.md))

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Your documentation site will be running at `http://localhost:3000`

## 📁 Project Structure

```
lithos/
├── vault/                      # Your Obsidian vault (source of truth)
│   ├── .obsidian/              # Obsidian config (excluded from processing)
│   ├── index.md                # Landing page
│   ├── 1.getting-started/      # Documentation sections
│   │   ├── .navigation.yml     # Sidebar config
│   │   ├── 2.introduction.md   # Numbered for ordering
│   │   └── 3.installation.md
│   ├── 2.concepts/
│   ├── 3.essentials/
│   └── 4.ai/
├── content -> vault            # Symlink for Docus compatibility
├── public/                     # Static assets (favicon, images)
└── package.json
```

### File Naming

- Use number prefixes for ordering: `2.introduction.md` → `/getting-started/introduction`
- Create `.navigation.yml` in each folder to customize sidebar title and icon

### Obsidian Features

- **Wikilinks**: `[[Page Name]]` syntax in markdown (plugin coming soon)
- **Callouts**: Map Obsidian callouts to Docus prose components
- **Frontmatter**: Aliases, tags, and metadata are preserved

## ⚙️ Configuration

Create `nuxt.config.ts` for custom settings:

```ts
export default defineNuxtConfig({
  site: {
    name: 'My Documentation',
  },
  content: {
    ignores: ['\\.obsidian']  // Already default
  }
})
```

### Ignoring Files

Lithos enforces strict ignoring of `.git`, `.obsidian`, and `.trash` folders. To ignore additional files, create a `.lithosignore` file in your vault root:

```
# .lithosignore
Private/
Drafts/
*.tmp
```

### Vault Sanitization

Use the included script to fix common frontmatter issues (like unescaped quotes) before generation:

```bash
node scripts/sanitize-vault.mjs ~/path/to/vault
```

Create `app.config.ts` for theme customization:

```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'purple',   // Match Obsidian's accent
      neutral: 'zinc'
    }
  },
  seo: {
    title: 'My Documentation',
    description: 'Published from Obsidian'
  }
})
```

## 🎨 Vault Theme Customization

Each vault can define its own theme by creating a `lithos.config.ts` file in the vault root. This allows per-vault customization without modifying the default Lithos theme.

### Configuration File

Create `lithos.config.ts` in your vault:

```ts
export default {
  // Site metadata
  site: {
    name: 'My Site',
    description: 'Site description'
  },

  // Theme configuration
  theme: {
    // Custom font stacks (Google Fonts are auto-loaded when detected)
    fonts: {
      sans: '"Inter", ui-sans-serif, system-ui, sans-serif',
      serif: '"Georgia", serif',
      mono: '"JetBrains Mono", ui-monospace, monospace'
    },

    // Primary color palette (50-950 shades)
    colors: {
      primary: {
        50: '#faf5ff',
        100: '#f3e8ff',
        200: '#e9d5ff',
        300: '#d8b4fe',
        400: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c22ce',
        800: '#6b21a8',
        900: '#581c87',
        950: '#3b0764'
      },

      // Light mode overrides
      light: {
        background: '#fafaf9',
        foreground: '#0c0a09',
        muted: '#78716c',
        border: '#e7e5e4',
        surface: '#ffffff',
        accent: '#a855f7'
      },

      // Dark mode overrides
      dark: {
        background: '#0c0a09',
        foreground: '#fafaf9',
        muted: '#a8a29e',
        border: '#292524',
        surface: '#1c1917',
        accent: '#c084fc'
      }
    },

    // Image treatment
    images: {
      noir: {
        enabled: true,        // Grayscale filter
        grayscale: 100,       // 0-100%
        contrast: 115,        // Percentage
        hoverRestore: true    // Restore color on hover
      },
      scanlines: {
        enabled: true,        // CRT scanline overlay
        opacity: 0.025        // Subtle effect
      },
      vignette: {
        enabled: true,        // Dark edge vignette
        opacity: 0.5
      }
    },

    // Typography adjustments
    typography: {
      headingTracking: '-0.02em',  // Tight heading letter-spacing
      bodyTracking: '0',
      codeTracking: '0'
    }
  },

  // Header links
  header: {
    logo: true,
    links: [
      {
        icon: 'i-simple-icons-github',
        to: 'https://github.com/username',
        target: '_blank'
      }
    ]
  },

  // Footer configuration
  footer: {
    credits: {
      text: 'Powered by Lithos',
      href: 'https://github.com/jwintz/lithos'
    }
  }
}
```

### Supported Google Fonts

When a recognized font name is detected in the `fonts` configuration, Lithos automatically loads it from Google Fonts. Currently supported:

- **Recursive** - Variable font for code & UI
- **Inter** - Modern sans-serif
- Additional fonts can be loaded via `<link>` in `nuxt.config.ts`

### Image Filters

The image treatment options create a distinctive visual style:

| Option | Effect |
|--------|--------|
| `noir` | Converts images to high-contrast grayscale |
| `scanlines` | Adds subtle CRT-style horizontal lines |
| `vignette` | Darkens image edges for focus |

All filters support `hoverRestore: true` to reveal the original color on hover.

## ⚡ Built with

- [Nuxt 4](https://nuxt.com) - The web framework
- [Docus](https://docus.dev) - Documentation theme
- [Nuxt Content](https://content.nuxt.com/) - File-based CMS
- [Nuxt UI](https://ui.nuxt.com) - UI components

## CLI

Lithos provides a CLI to generate static sites from any Obsidian vault.

### Usage

```bash
# Cleanup all build caches and output directories
npm run cleanup

# Generate a static site from a specific vault
npm run generate -- --vault="~/Vaults/MyVault" --output="./dist"

# Start dev server with a specific vault
npm run dev -- --vault="~/Vaults/MyVault"

# Use defaults (vault=./content, output=.output/public)
npm run generate
```

### Commands

| Command | Description |
|---------|-------------|
| `generate` | Generate a static site from the vault |
| `dev` | Start development server with hot reload |
| `build` | Build for production (SSR mode) |
| `preview` | Preview a production build locally |
| `cleanup` | Remove all build caches and output directories |

### Options

| Flag | Default | Description |
|------|---------|-------------|
| `--vault <path>` | `./content` (existing symlink) | Path to Obsidian vault |
| `--output <path>` | `.output/public` | Output directory for static generation |

When `--vault` is provided, Lithos creates (or updates) a `content/` symlink pointing to the vault directory. This lets Obsidian and Nuxt Content both work with the same files.

### npm scripts

You can also use the standard npm scripts directly:

```bash
npm run dev       # Development server
npm run build     # Production build (SSR)
npm run generate  # Static site generation
npm run preview   # Preview production build
```

## Landing Page

Lithos supports Docus landing pages. When an `index.md` file exists in your vault root, it is served at `/` as the landing page. Without it, `/` redirects to `/home`.

### Creating a Landing Page

Create `index.md` in your vault root with Docus MDC components:

```markdown
---
title: My Digital Garden
description: Welcome to my knowledge base
navigation: false
---

::u-landing-hero
---
title: My Digital Garden
description: Notes, ideas, and research — beautifully published.
links:
  - label: Browse Notes
    to: /home
    icon: i-lucide-book-open
    size: xl
  - label: View Graph
    to: /graph
    icon: i-lucide-share-2
    variant: outline
    size: xl
---
::

::u-landing-grid
  ::u-landing-card
  ---
  title: Interconnected Notes
  icon: i-lucide-link
  description: Wikilinks, backlinks, and graph visualization.
  ---
  ::

  ::u-landing-card
  ---
  title: Rich Content
  icon: i-lucide-file-text
  description: Math, Mermaid diagrams, ABC music notation, and more.
  ---
  ::
::
```

### Available Components

| Component | Purpose |
|-----------|---------|
| `::u-landing-hero` | Hero section with title, description, CTA buttons |
| `::u-landing-grid` | Feature grid layout |
| `::u-landing-card` | Individual feature card |
| `::u-landing-section` | Content section |
| `::u-landing-cta` | Call-to-action block |

See the [Nuxt website](https://nuxt.com) for design inspiration.

### Without a Landing Page

If no `index.md` exists, Lithos redirects `/` to `/home`. Create a `Home.md` in your vault to serve as the default entry point.

## Deployment

Build for production:

```bash
npm run build
```

Generate static site:

```bash
npm run generate
```

**Serve locally for testing:**

```bash
npx serve .output/public
```

The static output is in `.output/public/` and can be deployed to any static hosting provider (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

## License

[MIT License](https://opensource.org/licenses/MIT)