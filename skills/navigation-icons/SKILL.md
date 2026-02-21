---
name: navigation-icons
description: Add icons to navigation items using frontmatter or .navigation.md folder files.
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

## Folder Icons (.navigation.md)

Configure folder icons using `.navigation.md` files placed inside the folder. These are frontmatter-only files (no body content):

```yaml
# features/.navigation.md
---
title: Features
navigation:
  title: Features
  icon: i-lucide-star
  order: 1
---
```

This sets the folder's display title, icon, and position in the sidebar.

### Examples from Reference Vaults

**Hyalo vault** — each section folder has a `.navigation.md`:

```yaml
# init/.navigation.md
---
title: Init System
navigation:
  title: Init System
  icon: i-lucide-layers
  order: 2
---

# lisp/.navigation.md
---
title: Lisp Side
navigation:
  title: Lisp Side
  icon: i-lucide-parentheses
  order: 3
---

# swift/.navigation.md
---
title: Swift Side
navigation:
  title: Swift Side
  icon: i-lucide-layers-3
  order: 4
---
```

## With Numeric Prefix Folders

When using numeric filename prefixes, the prefix handles ordering. Use `.navigation.md` for icons and display titles:

```yaml
# 1.guide/.navigation.md
---
title: Guide
navigation:
  icon: i-lucide-book-open
---
```

No `order` needed here — the numeric prefix `1.` determines position.

## Available Icon Sets

Lithos supports these icon prefixes (via `@nuxt/icon`):

| Prefix | Set | Examples |
|--------|-----|----------|
| `i-lucide-*` | [Lucide Icons](https://lucide.dev/icons) | `i-lucide-home`, `i-lucide-settings` |
| `i-heroicons-*` | [Heroicons](https://heroicons.com/) | `i-heroicons-home`, `i-heroicons-cog` |
| `i-simple-icons-*` | [Simple Icons](https://simpleicons.org/) | `i-simple-icons-github` |

## Custom Icons

For custom SVG icons, place them in `assets/icons/` and reference via path:

```yaml
navigation:
  icon: /assets/icons/custom.svg
```
