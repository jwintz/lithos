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

::div{class="max-w-(--ui-container) mx-auto px-4 pb-16"}
![Lithos Documentation Interface](/_raw/assets/Landing-1.png){.w-full .rounded-xl .shadow-2xl .ring-1 .ring-gray-200 .dark:ring-white/10}
::

::u-page-grid{class="lg:grid-cols-3 max-w-(--ui-container) mx-auto px-4 pb-24"}

:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-2
to: /features/obsidian-syntax
icon: i-lucide-file-text
---
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
icon: i-lucide-network
---
#title
Interactive Graph View

#description
Explore your knowledge base through a force-directed **graph visualization**. Navigate your vault spatially with hover highlighting and click-to-navigate.
:::

:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-1
to: /features/bases
icon: i-lucide-database
---
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
icon: i-lucide-search
---
#title
Daily Notes & Search

#description
Transform chronological daily notes into a navigable blog archive with date-based routing and RSS feeds. Built-in **command palette** search lets readers find any page instantly.
:::

:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-2
to: /agentic/ai
icon: i-lucide-bot
---
#title
AI-Ready with Native MCP

#description
A built-in **[[MCP Server]]** exposes your documentation to AI agents. Claude, Cursor, VS Code, and other MCP-compatible tools can read, search, and reason about your knowledge base.
:::

:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-1
to: /agentic/skills
icon: i-lucide-zap
---
#title
Agent Skills

#description
Extend AI capabilities with specialized **skills** for documentation writing, landing pages, and vault management. Agentic workflows that understand your project.
:::

:::u-page-card
---
spotlight: true
class: col-span-3 lg:col-span-1
to: /guide/deployment
icon: i-lucide-rocket
---
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
icon: i-lucide-cpu
---
#title
Powered by Docus

#description
Built on **Docus v5** — the Nuxt-based documentation framework. Full Nuxt ecosystem access, MDC component syntax, Nuxt UI design system, and production-grade performance.
:::

::

