# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Changelog page using Nuxt UI `ChangelogVersions` component
- `NUXT_PUBLIC_SITE_URL` environment variable support for RSS feeds on static sites

### Fixed

- Wikilinks in frontmatter now display correctly instead of "(truncated link)"
- RSS feed now uses correct site URL instead of `localhost` on GitHub/GitLab Pages
- Header logo link no longer causes double baseURL prefix (e.g., `/jwintz/jwintz/`) when clicked
- Client-side navigation sorting now works correctly for client-side rendered pages
- GitLab CI cache now properly preserves `node_modules/` and `.nuxt/` between builds
- GitLab CI now updates existing lithos clone instead of always cloning fresh

## [0.1.0] - 2026-02-05

Initial public release of Lithos - a static site generator that transforms Obsidian vaults into documentation sites.

### Added

#### Core Features
- **Obsidian Syntax Support**: Wikilinks (`[[Page]]`), embeds (`![[Note]]`), callouts, and frontmatter properties
- **Obsidian Bases**: Database-like views with table/card layouts, filtering, sorting, and formulas
- **Graph View**: Interactive knowledge graph visualization with backlinks
- **Daily Notes**: Date-based routing with navigation between entries
- **Properties Panel**: Collapsible frontmatter display with type-aware rendering

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
- GitHub Pages workflow (`.github/workflows/deploy.yml`)
- GitLab Pages CI configuration (`.gitlab-ci.yml`)
- RSS feed generation with full content support
- SEO-friendly static HTML output

#### Developer Experience
- CLI with `dev`, `generate`, and `preview` commands
- `--vault` flag to specify vault location
- Hot module replacement in development
- Content caching for fast rebuilds

### Technical Details

- Built on Nuxt 4 + Docus v5 as a Nuxt Layer
- Nuxt Content v3 with custom MDC transformers
- Nuxt UI v3 components
- TypeScript throughout

[Unreleased]: https://github.com/jwintz/lithos/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jwintz/lithos/releases/tag/v0.1.0
