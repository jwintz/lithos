---
name: navigation-icons
description: Add icons to navigation items using frontmatter properties
---

# Navigation Icons

Add icons to your navigation sidebar using the `navigation.icon` frontmatter property.

## Usage

```yaml
---
title: Research
navigation:
  icon: i-lucide-flask
---
```

The icon will appear next to the title in the navigation sidebar.

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
├── Research/           # navigation.icon: i-lucide-flask
│   └── index.md
├── Projects/           # navigation.icon: i-lucide-folder
│   └── index.md  
└── Blog/               # navigation.icon: i-lucide-pen
    └── index.md
```

## Custom Icons

For custom SVG icons, place them in `assets/icons/` and reference via path:

```yaml
navigation:
  icon: /assets/icons/custom.svg
```
