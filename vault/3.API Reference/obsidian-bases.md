---
title: obsidian-bases
description: Implements structured data views from YAML definitions.
order: 2
icon: i-lucide-database
navigation:
  icon: i-lucide-database
---

The `obsidian-bases` module enables specialized data views (Tables, Lists, Cards) leveraging parsed metadata from your vault. It supports complex filtering, formula calculation, and aggregations.

## File Format

Base files use the `.base` extension and contain valid YAML.

```yaml
filters:
  and:
    - file.hasTag("project")
    - 'status == "active"'

formulas:
  days_remaining: '(date(due) - today()) / 86400000'

views:
  - type: table
    name: "Active Projects"
    order:
      - file.name
      - status
      - formula.days_remaining
```

## Filter Syntax

Filters narrow down results using text expressions and logical operators.

### Structure

```yaml
# Simple
filters: 'status == "done"'

# Logical AND
filters:
  and:
    - 'priority > 1'
    - 'file.hasTag("urgent")'

# Logical OR
filters:
  or:
    - 'category == "A"'
    - 'category == "B"'
```

### Properties

You can filter on:
- **File Metadata**: `file.name`, `file.mtime`, `file.size`, `file.tags`, `file.folder`
- **Frontmatter**: `status`, `author`, `priority` (any key in your markdown frontmatter)
- **Computed Formulas**: `formula.my_calc`

## Formulas

Formulas allow you to compute new values.

```yaml
formulas:
  # Arithmetic
  total: "price * quantity"
  
  # Conditionals
  status_icon: 'if(done, "✅", "⏳")'
  
  # Date Math
  days_old: '(now() - file.ctime) / 86400000'
```

## View Types

1.  **Table**: Standard row/column layout.
2.  **Cards**: Grid layout, great for items with images (`cover` property).
3.  **List**: Simple list of items.
4.  **Map**: Geographic map (requires `lat`/`lng` properties).

## Component Usage

The module exposes the `::obsidian-base` MDC component for rendering frames.

```markdown
::obsidian-base{source="Projects" views='[{"type":"table"}]'}
::
```

(Ideally, use the `.base` file format which `obsidian-transform` converts into this component automatically).
