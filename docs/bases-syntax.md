# Obsidian Bases Syntax Support

Lithos supports Obsidian Bases in two formats:

## 1. Standalone `.base` Files

Pure YAML files with `.base` extension:

```yaml
# Bases/Projects.base
filters:
  and:
    - file.hasTag("project")
views:
  - type: cards
    name: Overview
    sort:
      - property: file.mtime
        direction: DESC
    image: note.cover
```

## 2. Inline Base Code Blocks

Markdown files with embedded `base` code blocks:

```markdown
## Recent Posts

```base
folder: Blog
sort: date desc
limit: 5
columns: title, date, type
views:
  - type: table
    name: Table
    filters:
      and:
        - file.inFolder("Blog")
```
```

## Supported Properties

### Top-Level Properties

| Property | Type | Description |
|----------|------|-------------|
| `folder` | string | Source folder (alias for `source`) |
| `source` | string | Source folder path |
| `filters` | object | Global filters applied to all views |
| `filter` | string | Simple filter expression |
| `sort` | string | Default sort (e.g., "date desc") |
| `limit` | number | Default result limit |
| `columns` | string | Default columns (comma-separated) |
| `views` | array | View definitions |
| `properties` | object | Property display configuration |
| `formulas` | array | Computed property definitions |

### View Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | `table`, `cards`, `list`, `calendar` |
| `name` | string | View name (for tabs and section targeting) |
| `filters` | object | View-specific filters (combined with global) |
| `sort` | array | Sort configuration |
| `order` | array | Columns to display |
| `limit` | number | Max results for this view |
| `groupBy` | string | Property to group by |
| `image` | string | Image property for cards (e.g., `note.cover`) |
| `imageFit` | string | CSS object-fit value |
| `imageAspectRatio` | number | Card image aspect ratio |
| `cardSize` | number | Card width in pixels |

### Filter Functions

| Function | Example | Description |
|----------|---------|-------------|
| `file.hasTag()` | `file.hasTag("project")` | Note has tag |
| `file.inFolder()` | `file.inFolder("Blog")` | Note is in folder |
| `file.hasLink()` | `file.hasLink("Note")` | Note links to target |

### Filter Operators

```yaml
filters:
  and:
    - file.hasTag("project")
    - status != "archived"
  or:
    - type == "sprint"
    - type == "tutorial"
  not:
    - file.hasTag("draft")
```

### Sort Configuration

```yaml
# String format (inline bases)
sort: date desc

# Array format (.base files)
sort:
  - property: date
    direction: DESC
  - property: title
    direction: ASC
```

### Property Access

| Prefix | Example | Description |
|--------|---------|-------------|
| `note.` | `note.cover` | Frontmatter property |
| `file.` | `file.name` | File metadata |
| (none) | `status` | Shorthand for `note.status` |

### File Properties

| Property | Description |
|----------|-------------|
| `file.name` | Filename without extension |
| `file.path` | Full path |
| `file.ext` | File extension |
| `file.mtime` | Modification time |
| `file.tags` | All tags |

## Embedding Bases

### Full Base

```markdown
![[Projects.base]]
```

### Specific View

```markdown
![[Drums.base#Routines - Beats]]
```

### With Alias

```markdown
![[Projects.base#Overview|My Projects]]
```

## Not Yet Implemented

- `calendar` view type
- `map` view type
- `formulas` (computed properties)
- `groupBy` display
- Property editing
