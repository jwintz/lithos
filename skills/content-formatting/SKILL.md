---
name: content-formatting
description: Ensure consistent content formatting and avoid common issues
---

# Content Formatting Rules

This skill documents Lithos formatting conventions to avoid rendering issues.

## Title Handling

- **H1 headers are automatically stripped** – The title comes from frontmatter `title:` property
- If no frontmatter title exists, Lithos uses the filename as title

### Avoiding Title Duplication

❌ **Wrong** (causes double title):
```markdown
---
title: My Page
---
# My Page

Content starts here...
```

✅ **Correct** (single title from frontmatter):
```markdown
---
title: My Page
---

Content starts immediately after frontmatter...
```

## Frontmatter Requirements

Every page should have at minimum:

```yaml
---
title: Required Title
description: Optional but recommended for SEO
---
```

## Headers in Content

For section headers within your content, start with `## H2`:

```markdown
---
title: Guide Title
---

Introduction paragraph...

## First Section

Content of first section...

### Subsection

More detailed content...
```

## Special Characters

Escape special characters in YAML:
- Colons in titles: `title: "My: Title"`  
- Quotes: `title: 'He said "hello"'`
