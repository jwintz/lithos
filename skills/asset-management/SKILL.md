---
name: asset-management
description: Guidelines for organizing images, media, and assets in Obsidian vaults.
---

# Asset Management

Manage images, videos, and other media files in your vault.

## Directory Structure

```
vault/
├── Assets/              # Vault-level shared assets
│   ├── avatar.jpg       # Profile images
│   ├── logo.svg         # Branding
│   └── icons/           # Icon library
├── Blog/
│   └── assets/          # Blog-specific assets
│       └── 2026-01-post/
│           └── screenshot.png
└── Project/
    └── assets/          # Project-specific assets
```

**Best Practice:** Co-locate assets with content for portability.

## Image Guidelines

### Formats

| Format | Use Case | Notes |
|--------|----------|-------|
| `.svg` | Icons, logos, diagrams | Scales infinitely, small size |
| `.webp` | Photos, screenshots | Best compression, wide support |
| `.png` | Screenshots with transparency | Fallback for older browsers |
| `.jpg` | Photos without transparency | Good compression |

### Size Recommendations

- **Hero images**: max 1920×1080, < 200KB
- **Content images**: max 800px wide, < 100KB  
- **Thumbnails**: 400×300, < 30KB
- **Icons**: 24×24 or 32×32 SVG

### Optimization Tools

```bash
# WebP conversion
cwebp -q 80 input.png -o output.webp

# Batch optimize PNGs
find . -name "*.png" -exec pngquant --quality=65-80 {} \;

# SVG optimization
svgo input.svg -o output.svg
```

## Referencing Assets

### Markdown Syntax
```markdown
![Alt text](assets/image.webp)
```

### Obsidian Embed
```markdown
![[assets/image.webp]]
```

### MDC with Styling
```markdown
::img{src="assets/image.webp" class="rounded-lg shadow-lg"}
::
```

### Inline HTML (for CSS filters)
```html
<img src="assets/avatar.jpg" class="dark:invert" alt="Avatar">
```

## Dark Mode Handling

### CSS Filters for Theme Adaptation

```html
<!-- Invert for dark mode (good for line art) -->
<img src="diagram.svg" class="dark:invert dark:hue-rotate-180">

<!-- Reduce brightness in dark mode -->
<img src="photo.webp" class="dark:brightness-90">

<!-- Grayscale for muted aesthetic -->
<img src="logo.png" class="grayscale hover:grayscale-0 transition">
```

### Dual Assets Approach

For complex graphics, provide both versions:

```markdown
<picture>
  <source srcset="assets/chart-dark.svg" media="(prefers-color-scheme: dark)">
  <img src="assets/chart-light.svg" alt="Chart">
</picture>
```

## Video & Recordings

### Embedding Videos

Local videos (webm/mp4):
```html
<video controls class="w-full rounded-lg">
  <source src="assets/demo.webm" type="video/webm">
  <source src="assets/demo.mp4" type="video/mp4">
</video>
```

YouTube embed:
```markdown
::youtube{id="dQw4w9WgXcQ"}
::
```

### Browser Recordings

Recordings captured during Lithos development are saved as `.webp` animated images:

```markdown
![Demo Recording](/path/to/recording.webp)
```

## Avatar Best Practices

For profile/author images:

```yaml
# frontmatter
author:
  name: John Doe
  avatar: /Assets/avatar.webp
```

Display with fallback:
```vue
<UAvatar :src="author.avatar" :alt="author.name" />
```

## Performance Tips

1. **Lazy load** below-fold images: `loading="lazy"`
2. **Specify dimensions** to prevent layout shift
3. **Use responsive images** when possible
4. **Compress before commit** - don't rely on build-time optimization

## Common Issues

### Image Not Found in Static Build

Ensure assets are in:
- `public/` for absolute paths (`/image.png`)
- `content/` for relative paths (`./image.png`)
- Vault directory (mounted at `/_raw/`)

### Dark Mode Filter Artifacts

Some filters create halos. Solutions:
- Use `backdrop-filter` instead
- Provide separate dark-mode assets
- Apply to container, not image

### Large File Warnings

If Git warns about large files:
1. Compress the asset
2. Use Git LFS for files > 1MB
3. Host externally and link
