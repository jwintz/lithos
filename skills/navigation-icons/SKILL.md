---
name: navigation-icons
description: Add icons to navigation items using frontmatter properties or folder configuration
---

# Navigation Icons

Add icons to your navigation sidebar for both pages and folders.

## Page Icons (Frontmatter)

Add icons to individual pages using the `navigation.icon` frontmatter property:

```yaml
---
title: Getting Started
navigation:
  icon: i-lucide-rocket
---
```

Or use the shorthand `icon` property (both work):

```yaml
---
title: Getting Started
icon: i-lucide-rocket
---
```

## Folder Icons (.navigation.yml)

Configure folder icons using `.navigation.yml` files placed inside the folder:

```yaml
# 1.guide/.navigation.yml
title: Guide
icon: i-lucide-book-open
```

**Important**: Do NOT create `index.md` files inside folders. Use `.navigation.yml` for folder metadata.

## Available Icon Sets

Lithos supports these icon prefixes (via `@nuxt/icon`):

| Prefix | Set | Examples |
|--------|-----|----------|
| `i-lucide-*` | [Lucide Icons](https://lucide.dev/icons) | `i-lucide-home`, `i-lucide-settings` |
| `i-heroicons-*` | [Heroicons](https://heroicons.com/) | `i-heroicons-home`, `i-heroicons-cog` |
| `i-simple-icons-*` | [Simple Icons](https://simpleicons.org/) | `i-simple-icons-github` |

## Example Structure

```
vault/
├── index.md                    ← Landing page (only index allowed)
├── 1.guide/
│   ├── .navigation.yml         ← Folder icon: i-lucide-book-open
│   ├── 1.getting-started.md    ← Page icon in frontmatter
│   └── 2.configuration.md
├── 2.features/
│   ├── .navigation.yml         ← Folder icon
│   └── 1.obsidian-syntax.md    ← Page with navigation.icon
└── About.md                    ← Root page with icon
```

## Custom Icons

For custom SVG icons, place them in `assets/icons/` and reference via path:

```yaml
navigation:
  icon: /assets/icons/custom.svg
```
