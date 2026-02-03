---
title: Available Icons
description: Browse and search all Lucide icons available in Lithos documentation sites.
order: 5
icon: i-lucide-smile
navigation:
  icon: i-lucide-smile
tags: [icons, ui, design]
---

Lithos uses **Lucide icons** throughout the documentation interface. Icons are referenced using the `i-lucide-{name}` format in frontmatter and MDC components.

## Icon Browser

::icon-browser
::

## Usage Examples

### In Frontmatter

```yaml
---
title: My Page
icon: i-lucide-book-open
navigation:
  icon: i-lucide-book-open
---
```

### In MDC Components

```md
::u-button{icon="i-lucide-download"}
Download
::

::callout{icon="i-lucide-info"}
This is an info callout with a custom icon.
::
```

### In Vue Components

```vue
<template>
  <UIcon name="i-lucide-settings" class="size-5" />
  <UButton icon="i-lucide-plus" label="Add Item" />
</template>
```

## Icon Categories

| Category | Common Icons |
|----------|-------------|
| Navigation | `arrow-*`, `chevron-*`, `menu`, `x`, `search` |
| Actions | `plus`, `minus`, `check`, `edit`, `trash`, `copy`, `save` |
| Files | `file-*`, `folder-*`, `archive`, `package` |
| Content | `book-*`, `text`, `code`, `list-*`, `heading-*` |
| Users | `user-*`, `users`, `contact` |
| Status | `info`, `alert-*`, `check-circle`, `x-circle` |
| Media | `image`, `camera`, `music`, `video` |
| Development | `git-*`, `terminal`, `bug`, `code` |

## Resources

- [Lucide Icons](https://lucide.dev/icons) - Full icon library and documentation
- [Nuxt UI Icons](https://ui.nuxt.com/getting-started/icons) - How icons work in Nuxt UI
