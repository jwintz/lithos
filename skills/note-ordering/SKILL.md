---
name: note-ordering
description: Configure navigation ordering for Obsidian vaults using frontmatter, .navigation.md files, or numeric filename prefixes.
---

# Note Ordering & Navigation

Lithos supports multiple ordering strategies. Choose the one that fits your vault's structure — all are equally valid.

## Ordering Priority

Lithos determines sort order by checking (in order):

1. **`order` or `navigation.order`** from frontmatter (explicit)
2. **Numeric filename prefix** (`1.`, `2.`, etc.) stripped from URLs
3. **Date prefix** in filename (`YYYY-MM-DD-*`) — sorted newest first
4. **Alphabetical** by title (fallback)

The first match wins. This means frontmatter `order` always overrides numeric prefixes.

## Strategy 1: Frontmatter Ordering with `.navigation.md`

Best for vaults that want clean folder names (no numeric prefixes) and full control from frontmatter. Used by the Hyalo vault.

### Folder Structure

```
vault/
├── index.md                    ← Landing page (navigation: false)
├── Changelog.md                ← order: 99
├── features/
│   ├── .navigation.md          ← Folder metadata (title, icon, order)
│   ├── index.md                ← Section overview (order: 0)
│   ├── appearance.md           ← order: 1
│   ├── architecture.md         ← order: 6
│   └── init-system.md          ← order: 3
├── init/
│   ├── .navigation.md
│   ├── index.md
│   ├── bootstrap.md            ← order: 1
│   ├── emacs.md                ← order: 2
│   └── editing.md              ← order: 3
└── swift/
    ├── .navigation.md
    ├── index.md
    └── core.md
```

### `.navigation.md` Files

A `.navigation.md` file sets **folder-level** navigation metadata. It is a frontmatter-only file (no body content):

```yaml
---
title: Features
navigation:
  title: Features
  icon: i-lucide-star
  order: 1
---
```

This controls how the folder appears in the sidebar: its display title, icon, and position among sibling folders.

### Section Index Files

Each folder can have an `index.md` that serves as the section landing page:

```yaml
---
title: Init System
description: Hyalo's modular Emacs init system
navigation:
  icon: i-lucide-layers
  order: 0
order: 0
tags:
  - init
  - overview
---

Section overview content here...
```

Setting `order: 0` ensures the index page appears first within its folder.

### Individual Pages

```yaml
---
title: init-bootstrap
description: Early startup, package management, and load-path setup
navigation:
  icon: i-lucide-play
order: 1
tags:
  - init
  - emacs-lisp
---
```

## Strategy 2: Numeric Filename Prefix

Best for documentation sites where the file order in the filesystem should match the reading order. Used by the Lithos and Pi-Island vaults.

### Folder Structure

```
vault/
├── index.md                    ← Landing page
├── 1.guide/
│   ├── 1.getting-started.md    → /guide/getting-started
│   ├── 2.configuration.md      → /guide/configuration
│   └── 3.deployment/
│       ├── 1.overview.md       → /guide/deployment/overview
│       └── 2.github.md         → /guide/deployment/github
├── 2.features/
│   ├── 1.obsidian-syntax.md    → /features/obsidian-syntax
│   └── 2.graph.md              → /features/graph
├── 3.api-reference/
└── 4.design/
```

The numeric prefix is **stripped from URLs** but preserved for ordering. No frontmatter `order` is needed — the prefix IS the order.

### Adding Icons with Numeric Prefixes

Since folders are ordered by prefix, use `.navigation.md` for folder icons:

```yaml
# 1.guide/.navigation.md
---
title: Guide
navigation:
  icon: i-lucide-book-open
---
```

Or set icons on individual pages via frontmatter:

```yaml
---
title: Getting Started
navigation:
  icon: i-lucide-rocket
---
```

## Strategy 3: Fractional Ordering

Best for blog/portfolio vaults where pages span multiple folders and need a global reading flow. Used by the Academic vault.

### Folder Structure

```
vault/
├── Home.md                     ← order: 1
├── About.md                    ← order: 2
├── Bases/
│   ├── Posts.base              ← order: 3.1
│   └── Projects.base           ← order: 3.2
├── Blog/
│   ├── 2026-02-15-Post-A.md   ← order: 4.0 (newest)
│   ├── 2026-02-08-Post-B.md   ← order: 4.1
│   └── 2026-01-26-Post-C.md   ← order: 4.2 (oldest)
├── Projects/
│   ├── ProjectA.md             ← order: 5.1
│   └── ProjectB.md             ← order: 5.2
└── Colophon.md                 ← order: 7
```

Integer part groups items by section. Decimal part orders within the section. Leave gaps for future insertions.

### Full Frontmatter Example

```yaml
---
title: 'Extending Lithos with Custom Components'
description: 'A practical guide to creating reusable, theme-aware Vue components.'
created: 2026-02-08
tags:
  - nuxt
  - vue
  - tutorial
status: published
order: 4.0
icon: i-lucide-puzzle
navigation:
  icon: i-lucide-puzzle
  order: 4.0
---
```

### Blog Post Ordering

Blog posts typically use **reverse chronological order** (newest first = lowest decimal). When adding a new post:
1. Check the current lowest blog order (e.g., `4.1`)
2. Assign the new post a lower number (e.g., `4.0`)

## Landing Pages

The vault root `index.md` serves as the landing page. Set `navigation: false` to hide it from the sidebar:

```yaml
---
title: My Site
description: Welcome to my documentation.
navigation: false
---
```

If no `index.md` exists, Lithos redirects `/` to `/home`.

## Bottom Navigation Cards

At the bottom of each page, Lithos displays **Previous** and **Next** cards. For rich cards, include:

```yaml
---
title: Getting Started
description: Install and configure Lithos for your Obsidian vault.
navigation:
  icon: i-lucide-rocket
order: 1
---
```

The `description` appears as a subtitle in the navigation cards.

## Implementation Details

Lithos extracts ordering via:
- `modules/obsidian-ordering.ts` — Parses `order`/`weight` from frontmatter, sets `navigation.order`
- `composables/useNavSorting.ts` — Sorts navigation items using the priority chain
- `app.vue` — Applies sorting transform to navigation data for SSR parity
