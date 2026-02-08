# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Direct URL access (cold load) on static hosts returning 404 due to trailing slash mismatch between SSR and client hydration; `route.path` is now normalized before use in `useAsyncData` keys and `queryCollection` queries
- `lithos cleanup` deleting the `public/` source directory (favicons, logos) alongside build artifacts
- RSS feed `<content:encoded>` now contains properly formatted HTML instead of plain text; AST is converted to HTML preserving tags, attributes, and structure
- Inline bases (` ```base ` code blocks in markdown) failing to render due to double quotes in filter expressions (e.g. `file.inFolder("Assets")`) breaking MDC attribute parsing; now uses base64-encoded config to avoid quoting issues
- Inline bases with view-level filters returning no results because the `path:` field was incorrectly used as a source pre-filter, excluding docs outside that path; source pre-filter is now skipped when views define their own filters

### Added

- Changelog page using Nuxt UI `ChangelogVersions` component
- `NUXT_PUBLIC_SITE_URL` environment variable support for RSS feeds on static sites
- `app.vue` override of Docus to sort and decorate navigation in `useAsyncData` transform
- Inline base shorthand props (`folder`, `layout`, `sort`, `direction`, `limit`) for `::obsidian-base` MDC component

### Changed

- `sortNavigationItems()` now also decorates items with icons, base-item classes, and folder renames
- `filter-navigation.ts` plugin reduced to DOM-only enhancements (pills, controls, path fixing)

### Fixed

- Eliminate 47 hydration mismatches caused by server/client navigation order mismatch
- Navigation sorting now runs BEFORE component rendering (in `useAsyncData` transform) instead of after (`app:rendered` hook)
- Icons and `lithos-base-item` class now present in server-rendered HTML for SSR parity
- Wikilinks in frontmatter now display correctly instead of "(truncated link)"
- RSS feed now uses correct site URL instead of `localhost` on GitHub/GitLab Pages
- Header logo link no longer causes double baseURL prefix (e.g., `/jwintz/jwintz/`) when clicked
- Client-side navigation sorting now works correctly for client-side rendered pages
- GitLab CI cache now properly preserves `node_modules/` and `.nuxt/` between builds
- List view "Sort by" dropdown now shows the correct pre-selected value from base config
- Inline base `file.name` sorting now uses the actual filename stem (preserving date prefixes) instead of the display title
- Inline base `path` shorthand now recognized as a synonym for `folder`/`source` in `parseBaseYaml`
- Inline base `order` shorthand (separate from `sort`) now correctly sets sort direction
- ISO date timestamps in table cells now display as date-only (e.g., `2026-02-05` instead of `2026-02-05T00:00:00.000Z`)
- GitLab CI now updates existing lithos clone instead of always cloning fresh
- Root redirect rule no longer duplicates baseURL (fixes `/jwintz/jwintz/home` issue)

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
