---
name: lithos-landing
description: Create or edit the Lithos landing page (vault/index.md). Use when modifying the homepage hero, feature cards, or call-to-action sections.
---

# Lithos Landing Page

Creates and maintains the landing page at `vault/index.md`.

## Vault Location

`[WorkspaceRoot]/vault/index.md`

## Critical Rules

1.  **Layout**: The frontmatter MUST include `layout: page` and `navigation: false`.
2.  **No Sidebars**: The landing page uses the `landing` layout (no left/right sidebars).
3.  **Container**: The layout provides `<UContainer>` — do NOT add container wrappers in MDC.
4.  **MDC Components**: Use Nuxt UI page components (`::u-page-hero`, `:::u-page-grid`, `::::u-page-card`).
5.  **Feature Cards**: Minimum 6 cards covering core Lithos capabilities.
6.  **Images**: Use `::u-color-mode-image` for cards with images, providing both `dark` and `light` variants.
7.  **Internal Links**: Cards should link to internal feature/guide pages with `to: /features/...` or `to: /guide/...`.
8.  **No External Targets**: Do not set `target: _blank` for internal links.
9.  **Icons & Ordering**: Every page must have `icon`, `navigation.icon` (using `i-lucide-*` prefix), and `order` specified in the frontmatter.

## Card Grid Layout

Use a 3-column grid with cards spanning 1 or 2 columns:

```markdown
:::u-page-grid{class="lg:grid-cols-3"}

::::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-2  <!-- Wide card with image -->
to: /features/some-feature
---
:::::u-color-mode-image
---
height: 320
width: 859
alt: Description
class: w-full h-80 object-cover rounded-lg
dark: https://example.com/dark.png
light: https://example.com/light.png
---
:::::

#title
Feature Name

#description
Feature description with **bold** and [[wikilinks]].
::::

::::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-1  <!-- Narrow card with icon -->
to: /features/another
---
:icon{name="i-lucide-database" class="w-8 h-8 mb-4 text-primary"}

#title
Feature Name

#description
Description text.
::::

:::
```

## Recommended Feature Coverage

| Feature | Source | Card Type |
|---------|--------|-----------|
| Obsidian Syntax | Obsidian | Wide (image) |
| Graph View | Obsidian | Narrow (icon) |
| Databases (Bases) | Obsidian | Narrow (icon) |
| MCP / AI | Docus | Wide (image) |
| Static Generation | Nuxt | Narrow (icon) |
| Daily Notes / Search | Both | Wide (image) |

## Image Sources

- Obsidian: `https://obsidian.md/images/screenshot-1.0-hero-combo.png`
- Docus MCP: `https://docus.dev/landing/dark/mcp.svg` (+ light variant)
- Docus Search: `https://docus.dev/landing/dark/command-menu.png` (+ light variant)
- Docus Templates: `https://docus.dev/landing/dark/templates-ui-pro.webp` (+ light variant)

## Frontmatter

```yaml
---
title: Lithos
description: Turn your Obsidian Vault into a beautiful documentation website.
layout: page
navigation: false
---
```
