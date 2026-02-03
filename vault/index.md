---
title: Lithos
description: Turn your Obsidian Vault into a beautiful documentation website.
navigation: false
---

::u-page-hero
---
title: Lithos
description: Transform your Obsidian Vault into a production-grade documentation site. Wikilinks, databases, graph view, and AI integration — powered by Nuxt and Docus.
links:
  - label: Get Started
    to: /guide/getting-started
    icon: i-lucide-arrow-right
    color: neutral
    size: xl
  - label: Star on GitHub
    to: https://github.com/jwintz/lithos
    icon: simple-icons-github
    color: neutral
    variant: outline
    size: xl
---
::

::u-page-grid{class="lg:grid-cols-3 max-w-(--ui-container) mx-auto px-4 pb-16"}

<!-- Row 1: Native Syntax (2/3) + Graph (1/3) -->
:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-2
to: /features/obsidian-syntax
---
::::noir-image
---
src: https://obsidian.md/images/screenshot-1.0-hero-combo.png
alt: Obsidian note-taking with bidirectional links and graph view
height: 240px
---
::::

#title
Obsidian Native Syntax

#description
Write with **[[wikilinks]]**, embed notes with `![[transclusion]]`, and use callouts, math, and Mermaid diagrams. Your vault stays untouched — Lithos translates everything at build time into web-ready HTML.
:::

:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-1
to: /features/graph
---
::::noir-image
---
src: https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80
alt: Interactive knowledge graph visualization
height: 240px
---
::::

#title
Interactive Graph View

#description
Explore your knowledge base through a force-directed **graph visualization**. Navigate your vault spatially with hover highlighting and click-to-navigate.
:::

<!-- Row 2: Bases (1/3) + Daily Notes & Search (2/3) -->
:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-1
to: /features/bases
---
::::noir-image
---
src: https://publish-01.obsidian.md/access/f786db9fac45774fa4f0d8112e232d67/Attachments/bases-noshadow.png
alt: Structured data views with tables, cards and filters
height: 240px
---
::::

#title
Structured Databases

#description
Turn folders into queryable databases with **[[Obsidian Bases]]**. Visualize your data as tables, cards, or lists with filters and formulas.
:::

:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-2
to: /features/daily-notes
---
::::noir-image
---
src: https://docus.dev/landing/light/command-menu.png
dark-src: https://docus.dev/landing/dark/command-menu.png
alt: Full-text search and command palette for documentation navigation
height: 240px
---
::::

#title
Daily Notes & Search

#description
Transform chronological daily notes into a navigable blog archive with date-based routing and RSS feeds. Built-in **command palette** search lets readers find any page instantly. Full-text search, keyboard shortcuts, and automatic navigation from your folder structure.
:::

<!-- Row 3: MCP (2/3) + Skills (1/3) -->
:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-2
to: /agentic/ai
---
::::noir-image
---
src: https://docus.dev/landing/light/mcp.svg
dark-src: https://docus.dev/landing/dark/mcp.svg
alt: AI-powered documentation with Model Context Protocol
height: 240px
---
::::

#title
AI-Ready with Native MCP

#description
A built-in **[[MCP Server]]** exposes your documentation to AI agents. Claude, Cursor, VS Code, and other MCP-compatible tools can read, search, and reason about your knowledge base. Automatic `llms.txt` generation included.
:::

:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-1
to: /agentic/skills
---
::::noir-image
---
src: https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80
alt: AI agent skills for extending capabilities
height: 240px
---
::::

#title
Agent Skills

#description
Extend AI capabilities with specialized **skills** for documentation writing, landing pages, and vault management. Agentic workflows that understand your project.
:::

<!-- Row 4: SSG (1/3) + Docus (2/3) -->
:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-1
to: /guide/deployment
---
::::noir-image
---
src: https://nuxt.com/__og-image__/static/docs/4.x/api/commands/generate/og.png
alt: Static site generation and deployment
height: 240px
---
::::

#title
Static Site Generation

#description
Generate a fully static, SEO-optimized site with `nuxt generate`. Deploy anywhere — GitHub Pages, Netlify, Vercel, or Cloudflare.
:::

:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-2
to: https://docus.dev
external: true
---
::::noir-image
---
src: https://nuxt.com/__og-image__/static/docs/4.x/getting-started/introduction/og.png
alt: Docus documentation framework
height: 240px
---
::::

#title
Powered by Docus

#description
Built on **Docus v5** — the Nuxt-based documentation framework. Full Nuxt ecosystem access, MDC component syntax, Nuxt UI design system, and production-grade performance. Your vault becomes a first-class web application.
:::

::
