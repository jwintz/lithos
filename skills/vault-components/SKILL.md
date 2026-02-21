---
name: vault-components
description: Add custom Vue components to a vault for use in markdown content or app-level overrides.
---

# Vault Local Components

Vaults can provide custom Vue components that extend or override Lithos defaults. Components are auto-registered — no manual imports needed.

## Component Directories

Place components in your vault under two directories:

| Directory | Purpose | Registration |
|-----------|---------|--------------|
| `vault/components/` | App-level overrides (header logo, footer, etc.) | Auto-imported, can override lithos built-ins |
| `vault/components/content/` | MDC components usable in markdown via `::component-name` | Auto-imported globally |

### How It Works

Lithos detects vault component directories at build time (`nuxt.config.ts`):

```typescript
components: {
  dirs: [
    { path: '~/components', pathPrefix: false },
    { path: '~/components/content', pathPrefix: false, global: true },
    // Vault-level components (auto-detected)
    { path: '<vault>/components', pathPrefix: false },
    { path: '<vault>/components/content', pathPrefix: false, global: true }
  ]
}
```

Vault components override lithos built-ins when they share the same name.

## App-Level Overrides

Place components in `vault/components/` to override Lithos defaults.

### Example: Custom Header Logo

```
vault/
└── components/
    └── AppHeaderLogo.vue    ← Overrides Lithos default header logo
```

```vue
<!-- vault/components/AppHeaderLogo.vue -->
<template>
  <NuxtLink to="/" class="logo-link">
    <img src="/logo.svg" alt="My Site" class="logo" />
  </NuxtLink>
</template>

<style scoped>
.logo { height: 28px; }
</style>
```

This replaces whatever Lithos renders in the header logo slot.

## Content Components (MDC)

Place components in `vault/components/content/` to make them available in markdown via MDC (Markdown Components) syntax.

### Naming Convention

- **File**: PascalCase (e.g., `FeatureStrip.vue`)
- **In markdown**: kebab-case (e.g., `::feature-strip`)

### Example: Highlight Strip

```vue
<!-- vault/components/content/HighlightStrip.vue -->
<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div class="highlight-strip">
    <UIcon v-if="icon" :name="icon" class="icon" />
    <div>
      <h3>{{ title }}</h3>
      <p v-if="description">{{ description }}</p>
    </div>
  </div>
</template>

<style scoped>
.highlight-strip {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.75rem;
}
.icon { font-size: 2rem; color: var(--ui-primary); }
h3 { margin: 0; font-size: 1.125rem; }
p { margin: 0.25rem 0 0; color: var(--ui-text-muted); font-size: 0.875rem; }
</style>
```

### Usage in Markdown

```markdown
::highlight-strip
---
title: Native Compilation
description: Compile Emacs Lisp to native code for maximum performance.
icon: i-lucide-zap
---
::
```

### With Slot Content

Components can accept slot content:

```markdown
::section-intro
---
title: Architecture
---
The system uses a bidirectional channel architecture
between Swift and Emacs Lisp.
::
```

```vue
<!-- vault/components/content/SectionIntro.vue -->
<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <section class="section-intro">
    <h2>{{ title }}</h2>
    <div class="body">
      <slot />
    </div>
  </section>
</template>
```

## Real-World Examples

### Hyalo Vault Components

```
hyalo/vault/components/
├── AppHeaderLogo.vue              ← Custom animated logo
└── content/
    ├── RellaxHero.vue             ← Cinematic hero section
    ├── FeatureStrip.vue           ← Feature showcase with image
    ├── HighlightsGallery.vue      ← Gallery of highlights
    ├── HighlightStrip.vue         ← Horizontal highlight bar
    ├── SectionIntro.vue           ← Section introduction block
    ├── StatCallout.vue            ← Statistics/metrics display
    ├── ImageMosaic.vue            ← Multi-image grid layout
    ├── MoreGrid.vue               ← Explore/more items grid
    └── AppleDocPage.vue           ← Apple documentation renderer
```

### Academic Vault Components

```
Academic/components/content/
├── ContactCard.vue                ← Profile/contact information
├── AwardCard.vue                  ← Awards & distinctions display
├── Timeline.vue                   ← Career/project milestones
├── ActivityFeed.vue               ← GitHub/GitLab activity stream
├── BuildStatus.vue                ← CI/CD pipeline status
├── TechStack.vue                  ← Technology stack display
├── RssSubscribe.vue               ← RSS subscription prompt
├── McpEndpoint.vue                ← MCP service endpoint info
├── SkillsGrid.vue                 ← Agent skills grid display
└── PrefixPackages.vue             ← Conda package listing
```

## Theme Integration

Vault components should use Lithos CSS variables for theme consistency:

```css
/* Colors */
color: var(--ui-text-default);
color: var(--ui-text-muted);
background: var(--ui-bg);
border-color: var(--ui-border);
color: var(--ui-primary);

/* Vault theme overrides (from lithos.config.ts) */
color: var(--lithos-accent, var(--ui-primary));
```

Use Nuxt UI components (`UButton`, `UCard`, `UIcon`, etc.) for built-in theme support.

## Assets

Components can reference assets placed in the vault:

```
vault/
├── Assets/
│   ├── hero-image.jpg
│   └── logo.svg
└── components/content/
    └── HeroSection.vue
```

Reference assets with root-relative paths or wikilink embeds in markdown:

```vue
<img src="/Assets/hero-image.jpg" alt="Hero" />
```
