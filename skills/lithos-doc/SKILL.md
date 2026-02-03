---
name: lithos-doc
description: Create documentation for the Lithos repository itself. Use this skill when writing guides, feature docs, or API references in the `vault/` directory.
---

# Lithos Documentation Creation

Creates documentation in the Lithos vault (`vault/`) following the project's structure.

## Vault Location

The Lithos documentation vault is located at:
`[WorkspaceRoot]/vault`

(In this repo: `./vault`)

## Critical Rules

1.  **Ordering**: ALWAYS include an `order` property in frontmatter.
2.  **No Duplicate Headers**: Do NOT include an H1 (`# Title`) in the markdown body. The `title` frontmatter is used as the page heading.
3.  **Icons**: ALWAYS include BOTH `icon` and `navigation.icon` properties using `i-lucide-*` format:
    ```yaml
    icon: i-lucide-rocket
    navigation:
      icon: i-lucide-rocket
    ```
4.  **Dead Links**: Verify that every `[[wikilink]]` points to an existing file.
5.  **Structure**: Follow the guide/features/api/design structure.
6.  **Folder Minimum**: Every folder MUST contain at least 2 notes. Never create a folder with only one file.
7.  **Cross-linking**: Use `[[wikilinks]]` liberally between related pages. Each page should link to at least 2 other pages.
8.  **Callouts**: Use `> [!tip]`, `> [!note]`, `> [!warning]` callouts for practical advice (at least 1 per page).

## Volumetry Requirements

- Each **section** (H2) must have 2-3 subsections (H3)
- Each **subsection** (H3) must have at least 3 paragraphs of substantive content
- Paragraphs should be 3-5 sentences each
- Target: 800-1500 words per page minimum
- Include code examples, configuration snippets, or diagrams where relevant
- Use external image references for illustrations where appropriate: `![alt](https://example.com/image.png)`

## Filename Format

```
vault/{Section}/{Topic}.md
```

Sections:
- `1.guide` — Getting started, configuration, writing, deployment
- `2.features` — Obsidian syntax, graph, bases, AI, daily notes, backlinks, skills
- `3.API Reference` — Module technical references
- `4.design` — Architecture, pipeline, design system

Example: `vault/2.features/graph.md`

## Frontmatter Schema

```yaml
---
title: string              # Page heading
description: string        # Brief summary for SEO/Nav (1 sentence)
order: number              # Sorting order (1, 2, 3...)
icon: string               # Icon (e.g., i-lucide-book)
navigation:
  icon: string             # Same icon for sidebar
tags:                      # Keywords (lowercase, hyphenated)
  - feature
  - setup
---
```

## Document Structure

```markdown
{Brief introduction — 2-3 sentences establishing context}

## {Major Topic}

{1-2 sentence intro to section}

### {Subtopic A}

{Paragraph 1 — explanation}

{Paragraph 2 — details or examples}

{Paragraph 3 — implications or best practices}

> [!tip] Practical Advice
> Actionable guidance for the reader.

### {Subtopic B}

{3+ paragraphs}

## {Second Major Topic}

### {Subtopic C}
...

## Related

- [[Related Page 1]]
- [[Related Page 2]]
```

## Obsidian Features to Use

- `[[wikilinks]]` for all internal navigation
- `> [!type]` callouts for tips, warnings, notes
- Code blocks with language specifiers
- YAML frontmatter for all metadata
- Tags for categorization

## Workflow

1.  Identify the correct section.
2.  Determine the next `order` number.
3.  Choose an appropriate `icon` (from Lucide set: https://lucide.dev/icons).
4.  Create the file WITHOUT a top-level H1 `#`.
5.  Write content meeting volumetry requirements.
6.  Add at least 2 `[[wikilinks]]` to related pages.
7.  Add at least 1 callout with practical advice.
8.  Verify all internal links exist.
9.  Confirm the folder will have at least 2 files after creation.
