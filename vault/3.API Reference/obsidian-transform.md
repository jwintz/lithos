---
title: obsidian-transform
description: Transforms Obsidian syntax to Nuxt-compatible formats.
order: 4
icon: i-lucide-scroll
navigation:
  icon: i-lucide-scroll
---

This module is the core of the Lithos translation layer. It intercepts Markdown files before parsing and applies regex-based transformations to support Obsidian-specific features.

## Capabilities

### Wikilinks

Converts standard Wikilinks into Docus-compatible Markdown links.

- **Input**: `[[My Page]]`
- **Output**: `[My Page](/my-page){.internal-link}`

### Embeds

Converts transclusions into `::note-embed` MDC components.

- **Input**: `![[My Note]]`
- **Output**:
  ```markdown
  ::note-embed{src="My Note"}
  ::
  ```

### Callouts

Transforms Obsidian callout syntax into Docus Alert components.

- **Input**:
  ```markdown
  > [!info] Note
  > Content
  ```
- **Output**:
  ```markdown
  ::callout{type="info"}
  #title
  Note
  #default
  Content
  ::
  ```


## Architecture & Mapping

Lithos sits between your Obsidian Vault and Nuxt Content, acting as a transformation layer. It allows you to write "Obsidian Flavored Markdown" while Nuxt Content receives "MDC Flavored Markdown".

### Transformation Pipeline

1.  **Reader**: Nuxt Content reads a `.md` file.
2.  **Hook (`content:file:beforeParse`)**: `obsidian-transform` intercepts the raw string.
3.  **Transform**: Regex-based replacers convert syntax.
4.  **Parser**: Nuxt Content parses the result into an AST (MDC).

### Syntax Mapping Tables

| Feature | Obsidian Syntax | Nuxt Content / MDC |
| :--- | :--- | :--- |
| **Internal Link** | `[[Page]]` | `[Page](/page){.internal-link}` |
| **Embed** | `![[Page]]` | `::note-embed{src="Page"}` |
| **Callout** | `> [!info]` | `::callout{type="info"}` |
| **Base (Inline)** | ` ```base ` | `::obsidian-base{...}` |
| **Math** | `$E=mc^2$` | `$E=mc^2$` (via remark-math) |

### Frontmatter Handling

Nuxt Content treats frontmatter properties as reactive data.
- **Obsidian**: `tags: [a, b]`
- **Nuxt**: Available as `page.tags` in templates.

