---
title: obsidian-ordering
description: Frontmatter-based sort order control.
order: 5
icon: i-lucide-sort-asc
navigation:
  icon: i-lucide-sort-asc
---

Allows you to control the Sidebar navigation order using `order` keys in Frontmatter, rather than renaming files with numeric prefixes (e.g., `1.File.md`).

## Usage

Add `order` to your file's frontmatter:

```yaml
---
title: My Page
order: 1
---
```

Files with lower `order` values appear first.
