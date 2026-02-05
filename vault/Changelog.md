---
title: Changelog
description: Release history and notable changes to Lithos
navigation:
  icon: i-lucide-history
order: 99
---

All notable changes to Lithos are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

:changelog-versions{:versions='[{"title":"Unreleased","description":"Changelog page, RSS site URL fix, frontmatter wikilink fix"},{"title":"v0.1.0","date":"2026-02-05","description":"Initial public release of Lithos","to":"https://github.com/jwintz/lithos/releases/tag/v0.1.0"}]'}

---

## Unreleased

### Added
- Changelog page using Nuxt UI ChangelogVersions component
- `NUXT_PUBLIC_SITE_URL` environment variable support for RSS feeds

### Fixed
- Wikilinks in frontmatter now display correctly instead of "(truncated link)"
- RSS feed uses correct site URL instead of localhost on static sites

---

## v0.1.0 - 2026-02-05

Initial public release of Lithos - a static site generator that transforms Obsidian vaults into documentation sites.

### Added

#### Core Features
- Obsidian syntax support: wikilinks, embeds, callouts, frontmatter properties
- Obsidian Bases with table/card views, filtering, sorting, formulas
- Interactive graph view with backlinks
- Daily notes with date-based routing
- Properties panel with type-aware rendering

#### Theme System
- Vault-level theme configuration via `lithos.config.ts`
- Custom color palettes (light/dark modes)
- Google Fonts integration
- Noir image effects (grayscale, vignette, scanlines)

#### Navigation
- Automatic sidebar generation from vault structure
- Configurable ordering via filename prefixes or frontmatter
- Folder icons via `.navigation.yml`
- Breadcrumb navigation

#### Deployment
- GitHub Pages workflow
- GitLab Pages CI configuration
- RSS feed generation with full content support
- SEO-friendly static HTML output

#### Developer Experience
- CLI with `dev`, `generate`, and `preview` commands
- `--vault` flag to specify vault location
- Hot module replacement in development

---

## Technical Stack

Lithos is built on:

- **Nuxt 4** with Docus v5 as a Nuxt Layer
- **Nuxt Content v3** with custom MDC transformers
- **Nuxt UI v3** components
- **TypeScript** throughout

For the raw changelog file, see [CHANGELOG.md on GitHub](https://github.com/jwintz/lithos/blob/main/CHANGELOG.md).
