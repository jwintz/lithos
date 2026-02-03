---
name: lithos-feature
description: Create feature documentation pages in vault/2.features/. Use when documenting a specific Lithos capability like graph view, bases, or daily notes.
---

# Lithos Feature Documentation

Creates feature pages in `vault/2.features/` that describe individual Lithos capabilities.

## Vault Location

`[WorkspaceRoot]/vault/2.features/{feature-name}.md`

## Critical Rules

1.  **Icon Required**: Both `icon` and `navigation.icon` in frontmatter using `i-lucide-*` format.
2.  **No H1**: Title comes from frontmatter only.
3.  **Folder Minimum**: `2.features/` must have at least 2 files at all times.
4.  **Tabs for Examples**: Use `::tabs` with Preview and Code tabs for syntax demonstrations:
    ```markdown
    ::tabs
      :::tabs-item{label="Preview" icon="i-lucide-eye"}
        {rendered output}
      :::
      :::tabs-item{label="Code" icon="i-lucide-code"}
        ```md
        {source code}
        ```
      :::
    ::
    ```
5.  **Wikilinks**: Link to at least 3 other pages (related features, guides, API references).
6.  **Callouts**: Use at least 2 callouts per page (tip, note, warning, etc.).

## Volumetry

- **Minimum 2 H2 sections** per page
- **Each H2 has 2-3 H3 subsections**
- **Each H3 has 3+ paragraphs** (3-5 sentences each)
- **Target**: 1000-2000 words per feature page
- Include practical code examples and configuration snippets

## Frontmatter Schema

```yaml
---
title: string              # Feature name
description: string        # One-sentence summary
order: number              # Position in sidebar (1-10)
icon: i-lucide-*           # Feature icon
navigation:
  icon: i-lucide-*         # Same icon for sidebar
tags:
  - feature-category
  - related-topic
---
```

## Document Structure

Feature pages follow a pattern of concept → usage → configuration:

```markdown
{Introduction: What is this feature and why does it matter? 2-3 sentences.}

## {Core Concept}

{Explain the mental model and philosophy.}

### {Aspect 1}
{3+ paragraphs explaining this aspect}

### {Aspect 2}
{3+ paragraphs with code examples}

## {Usage & Configuration}

### {Basic Usage}
{How to use it with ::tabs Preview/Code examples}

### {Customization}
{Configuration options, props, settings}

### {Integration}
{How it connects with other features, [[wikilinks]] to related pages}
```

## Existing Features (for cross-linking)

- [[Obsidian Native]] — Wikilinks, embeds, callouts, math
- [[Interactive Graph]] — Force-directed graph visualization
- [[Structured Data]] — Obsidian Bases and databases
- [[MCP Server]] — AI integration via Model Context Protocol
- [[Daily Notes]] — Blog archive and RSS feed
- [[Backlinks]] — Linked references and discovery
- [[Skill Framework]] — AI agent skill definitions

## Workflow

1.  Choose a clear, descriptive feature name.
2.  Determine `order` based on existing features.
3.  Select an appropriate Lucide icon.
4.  Write introduction explaining the "why."
5.  Structure content as concept → usage → configuration.
6.  Add `::tabs` examples for any syntax demonstrations.
7.  Cross-link to 3+ related pages.
8.  Add 2+ callouts with practical tips.
9.  Verify all wikilinks resolve.
