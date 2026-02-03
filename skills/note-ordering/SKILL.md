---
name: note-ordering
description: Configure linear reading flow for Obsidian notes using frontmatter and filename ordering.
---

# Note Ordering for Linear Reading

Lithos supports multiple ordering strategies for navigation and linear reading. Proper ordering ensures the sidebar, bottom navigation cards, and prev/next links all follow a consistent linear flow.

## Important: No index.md in Folders

**Do NOT create `index.md` files inside folders.** Lithos uses filename numeric prefixes for folder ordering. Creating index files causes navigation issues and duplicate entries.

The only `index.md` allowed is at the vault root for the landing page.

## Ordering Strategies

### 1. Filename Numeric Prefix (Recommended)

Prefix folder and file names with numbers for automatic ordering:

```
vault/
├── index.md                    ← Landing page (only index allowed)
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

The numeric prefix is **stripped from URLs** but preserved for ordering.

### 2. Frontmatter `order` Property

Use `order` in frontmatter for fine-grained control:

```yaml
---
title: Introduction
order: 1
---
```

**Tips:**
- Use gaps (`10`, `20`, `30`) for future insertions
- Lower numbers appear first
- Missing `order` = sorted after numbered items

### 3. Fractional Order for Cross-Folder Flow

For vaults without numeric folder prefixes (like blogs or portfolios), use **fractional ordering** to create a global linear reading flow across folders:

```yaml
# Home.md
---
title: Home
order: 1
---

# About.md
---
title: About
order: 2
---

# Bases/Posts.base
---
title: Posts
order: 3.1
---

# Bases/Projects.base
---
title: Projects
order: 3.2
---

# Blog/2026-01-20-Sprint-Log.md
---
title: Sprint Log
order: 4.1
---

# Blog/2026-01-26-Research-Update.md
---
title: Research Update
order: 4.2
---

# Projects/ProjectA.md
---
title: Project A
order: 5.1
---

# Projects/ProjectB.md
---
title: Project B
order: 5.2
---

# Colophon.md
---
title: Colophon
order: 7
---
```

This creates a reading flow: Home -> About -> Posts -> Projects -> Sprint Log -> Research Update -> Project A -> Project B -> Colophon

### 4. Navigation Frontmatter

Override navigation display with the `navigation` field:

```yaml
---
title: My Page
navigation:
  order: 5
  icon: i-lucide-home
  title: Custom Nav Title
---
```

## Ordering Priority

When determining sort order, Lithos checks (in order):
1. Filename numeric prefix (`1.`, `01.`, `001.`, etc.)
2. `navigation.order` frontmatter property
3. `order` or `weight` frontmatter property
4. Alphabetical by title

## Folder Configuration

Use `.navigation.yml` files for folder metadata (title, icon) - **not for ordering**:

```yaml
# 1.guide/.navigation.yml
title: Guide
icon: i-lucide-book-open
```

The folder's position comes from its numeric prefix (`1.guide` = first).

## Bottom Navigation Cards

At the bottom of each page, Lithos displays **Previous** and **Next** navigation cards. These cards show:

- **Title**: From `title` frontmatter
- **Description**: From `description` frontmatter (appears as subtitle)
- **Icon**: From `navigation.icon` or `icon` frontmatter

### Required Frontmatter for Rich Cards

For the best user experience, every page should include:

```yaml
---
title: Getting Started
description: Install and configure Lithos for your Obsidian vault.
order: 1
icon: i-lucide-rocket
navigation:
  icon: i-lucide-rocket
---
```

The `description` field is especially important - it appears in the bottom navigation cards and helps readers understand what each page covers before clicking.

### Card Rendering

The bottom cards are rendered by the `UContentSurround` component:

```
┌─────────────────────────┐  ┌─────────────────────────┐
│ ← Previous              │  │              Next →     │
│   Configuration         │  │   Writing Content       │
│   Customize your site   │  │   Master Markdown       │
│   through config files  │  │   and MDC components    │
└─────────────────────────┘  └─────────────────────────┘
```

## Effects on Navigation

### Sidebar
Items appear in order within their folder level, sorted by numeric prefix then frontmatter order.

### Prev/Next Links
At the bottom of each page, links follow the linear reading order. Pages without explicit ordering appear after ordered pages, sorted alphabetically.

### Surround Navigation
The page component calculates surround links from the sorted navigation tree:

```vue
<template>
  <UContentSurround :surround="surround" />
</template>
```

Where `surround` is `[prevPage, nextPage]` with each page containing `path`, `title`, `description`, and `icon`.

## Example: Academic-Style Vault

The Academic vault pattern demonstrates fractional ordering for a blog/portfolio site:

```
vault/
├── Home.md           (order: 1)
├── About.md          (order: 2)
├── Bases/
│   ├── Posts.base    (order: 3.1)
│   └── Projects.base (order: 3.2)
├── Blog/
│   ├── 2026-01-20-Sprint.md   (order: 4.1)
│   └── 2026-01-26-Research.md (order: 4.2)
├── Projects/
│   ├── ProjectA.md   (order: 5.1)
│   └── ProjectB.md   (order: 5.2)
└── Colophon.md       (order: 7)
```

Each file includes complete frontmatter:

```yaml
---
title: Sprint Log
description: Week 3 development sprint on the monitoring dashboard.
date: 2026-01-20
tags:
  - frontend
  - architecture
order: 4.1
icon: i-lucide-scroll
navigation:
  icon: i-lucide-scroll
---
```

## Example: Documentation-Style Vault

For documentation sites, use numeric filename prefixes:

```
vault/
├── index.md                     ← Landing page
├── 1.guide/
│   ├── .navigation.yml          ← { title: Guide, icon: i-lucide-book-open }
│   ├── 1.getting-started.md     (order: 1)
│   ├── 2.configuration.md       (order: 2)
│   ├── 3.writing.md             (order: 3)
│   └── 4.deployment/
│       ├── .navigation.yml
│       ├── 1.overview.md
│       ├── 2.github.md
│       └── 3.vercel.md
├── 2.features/
│   ├── .navigation.yml
│   ├── 1.obsidian-syntax.md
│   ├── 2.graph.md
│   └── 3.bases.md
├── 3.api-reference/
│   ├── .navigation.yml
│   └── 1.overview.md
└── 4.design/
    ├── .navigation.yml
    ├── 1.architecture.md
    └── 2.theming.md
```

Linear reading flow:
1. Landing -> Getting Started -> Configuration -> Writing -> Deployment Overview -> GitHub -> Vercel
2. -> Obsidian Syntax -> Graph -> Bases
3. -> API Overview
4. -> Architecture -> Theming

## Implementation Details

Lithos extracts ordering via:
- `modules/obsidian-ordering.ts` - Parses order from frontmatter and filenames
- `plugins/filter-navigation.ts` - Applies consistent sidebar ordering
- `pages/[[lang]]/[...slug].vue` - Computes surround (prev/next) from sorted navigation tree

The page component sorts navigation items using this priority:
1. `order` or `navigation.order` from frontmatter
2. Numeric prefix from filename (`1.`, `01.`, etc.)
3. Alphabetical by title

This ensures the sidebar, table of contents, and bottom navigation cards all display the same ordering.
