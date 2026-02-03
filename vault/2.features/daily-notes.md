---
title: Daily Notes
description: Transform your journal entries into a beautiful blog with RSS feeds and chronological navigation.
order: 4
icon: i-lucide-calendar
navigation:
  icon: i-lucide-calendar
tags:
  - daily-notes
  - blog
  - rss
---

Daily notes are the backbone of journaling in Obsidian, and Lithos transforms them into a sophisticated blogging system. Your private daily reflections can become a public-facing blog with chronological navigation, RSS feed support, and elegant date-based URLs. This feature bridges personal knowledge management with public content creation, letting you write once in Obsidian and publish automatically to the web.

## Automatic Detection and Transformation

Lithos intelligently recognizes daily notes based on your Obsidian configuration and transforms them into blog-style posts with beautiful URLs and metadata.

### Date-Based Route Transformation

Daily notes follow a predictable naming pattern in Obsidian: `YYYY-MM-DD.md`. Lithos detects these files and transforms their URLs into a hierarchical structure that improves SEO and readability. Instead of exposing the raw filename, Lithos creates date-based routes like `/daily-notes/2025/01/27`, making your content feel like a professional blog rather than a collection of flat files.

The transformation happens automatically during the build process through the `daily-notes` module. When a markdown file matches the date pattern and resides in your configured daily notes folder, Lithos extracts the year, month, and day components and restructures the path accordingly. This means you never have to manually manage URL structures or worry about filename conventions beyond what Obsidian already expects.

This hierarchical routing also enables powerful navigation patterns. Readers can mentally parse the URL structure to understand the temporal context of a post, and you could potentially create archive pages by year or month by querying the content API for paths matching those prefixes. The date structure becomes a natural taxonomy without requiring manual categorization.

### Configuration via .obsidian/daily-notes.json

Lithos reads your existing Obsidian daily notes configuration to ensure seamless compatibility. The `.obsidian/daily-notes.json` file, which Obsidian creates when you enable the Daily Notes core plugin, contains two critical pieces of information: the folder where daily notes are stored (e.g., "Daily Notes" or "Journal") and the date format pattern (typically "YYYY-MM-DD").

```json
{
  "folder": "Daily Notes",
  "format": "YYYY-MM-DD"
}
```

The beauty of this approach is that you don't need to configure Lithos separately. If your vault already uses daily notes, Lithos automatically detects the folder and applies the appropriate transformations. If the configuration file is missing, Lithos falls back to sensible defaults, looking for files matching the `YYYY-MM-DD` pattern in any folder.

The folder name is also used to generate the base route segment. A folder named "Daily Notes" becomes `/daily-notes`, while "Journal" becomes `/journal`. Lithos normalizes the folder name by converting it to lowercase and replacing spaces with hyphens, ensuring URL-friendly paths regardless of your folder naming conventions.

### Frontmatter Enhancement

During transformation, Lithos automatically injects metadata into each daily note's frontmatter to support blog-like functionality. This includes an `isDailyNote` flag that distinguishes these posts from regular documentation pages, a machine-readable `date` field in ISO 8601 format for sorting and filtering, and a human-readable `displayDate` that can be used in templates.

```yaml
---
isDailyNote: true
date: 2025-01-27T00:00:00.000Z
displayDate: "Monday, January 27, 2025"
title: "2025-01-27"
---
```

This metadata enhancement happens transparently in the `content:file:beforeParse` hook, meaning it never modifies your source files. The enriched frontmatter exists only in the processed content that Nuxt Content reads, preserving the integrity of your vault while enabling advanced querying and display logic in your templates.

## Date-Based Navigation and Discovery

Once your daily notes are transformed, Lithos provides several ways for readers to navigate through your journal chronologically.

### Previous and Next Links

Blog posts are most valuable when readers can easily move between them. Lithos automatically calculates the previous and next daily notes in chronological order, enabling you to add navigation links at the bottom of each post. This creates a linear reading experience, perfect for serialized content or progressive journaling.

The implementation leverages Nuxt Content's query API to fetch all daily notes, sort them by date, and find the immediate neighbors of the current post. You can implement this in your page template using the [[Structured Data]] components or by querying the content directly in a custom Vue component. The `isDailyNote` frontmatter flag makes filtering straightforward, ensuring only journal entries appear in the navigation chain.

This chronological linking creates a sense of continuity and progression. Readers who discover a single post can easily traverse backward to earlier thoughts or forward to see how ideas evolved. It transforms a collection of isolated notes into a cohesive narrative arc.

### Archive and Listing Views

Beyond individual post navigation, readers often want to see an overview of all available entries. Lithos's [[Structured Data]] system makes it trivial to create archive pages, whether as a simple list of titles and dates or as a rich grid with excerpts and metadata.

The `ObsidianBase` component can query your daily notes folder and render it as a table, list, or card grid. By filtering for `isDailyNote: true` and sorting by date descending, you create a blog archive page with just a few lines of configuration. You can further enhance this with pagination (coming soon), tag filtering to show posts by category, or grouping by year and month for a chronological archive.

```md
::obsidian-base{source="/daily-notes" layout="list" sort="date" direction="desc"}
::
```

These archive views serve multiple purposes. They act as a site map for search engines, improve discoverability for human readers, and provide a sense of the volume and consistency of your writing. A well-designed archive page can be one of the most visited pages on your site.

## RSS Feed Generation

Modern blogs rely on RSS feeds for syndication, and Lithos automatically generates one for your daily notes at `/rss.xml`.

### Automatic Feed Creation

The RSS feed is built at request time by the `/server/routes/rss.xml.ts` handler, which queries all content marked with `isDailyNote: true`, sorts by date, and formats it into RSS 2.0 XML. The feed includes standard elements like title, link, publication date, and description, making it compatible with all major feed readers.

Each feed item links directly to the daily note's public URL, and the publication date is derived from the `date` frontmatter field. This means your feed is always up-to-date and reflects the chronological order of your writing. Readers can subscribe in apps like Feedly, Reeder, or NetNewsWire and receive automatic updates whenever you publish new entries.

The feed is generated dynamically during development, but in production (with static site generation), it becomes a static XML file that loads instantly. This ensures fast performance while maintaining the dynamic convenience of server-side generation during development.

### Feed Customization

The RSS handler includes sensible defaults, but you can customize the feed's metadata by setting environment variables. The `NUXT_PUBLIC_SITE_URL` variable controls the base URL for all links, ensuring they resolve correctly in production. You can also modify the feed title and description directly in the route handler if you want to brand it specifically for your journal.

```bash
NUXT_PUBLIC_SITE_URL=https://yourdomain.com
```

Future enhancements will add support for categories (via tags), custom feed limits, and full-text content inclusion (currently only descriptions are included). These features will make your RSS feed even more powerful and flexible for different reader preferences.

## Integration with Frontmatter

Daily notes gain additional superpowers when you leverage frontmatter fields beyond the auto-injected metadata.

### Date, Tags, and Type Fields

While Lithos automatically adds a `date` field, you can override it manually if you want to backdate a post or schedule it for future publication. The `tags` field allows you to categorize daily notes by theme, making it possible to create tag-filtered archive pages (e.g., "Show all posts tagged #reflection").

The `type` field provides semantic differentiation. You might set `type: blog` for public-facing posts and `type: journal` for personal entries, then filter in your templates to only show blog-type posts on the main archive page. This gives you fine-grained control over what appears in RSS feeds and public listings without requiring separate folders.

```yaml
---
date: 2025-01-27
tags: [reflection, programming, learning]
type: blog
---
```

This frontmatter-driven approach means you can mix public and private notes in the same folder, deciding on a per-note basis what to expose. It's a flexible system that respects your evolving needs and workflows.

### Custom Metadata for Rich Display

Beyond the standard fields, you can add custom frontmatter for richer displays. A `cover` field pointing to an image can be rendered as a featured image in card layouts. An `excerpt` field provides a hand-crafted summary for archive pages, overriding the auto-generated description. A `featured` boolean flag can highlight specific posts on your homepage.

These custom fields integrate seamlessly with the [[Structured Data]] system, which automatically detects and renders them based on their type. An image field shows a thumbnail, a URL field renders a link button, and a boolean checkbox appears as a toggle. This convention-over-configuration approach keeps your markdown clean while enabling sophisticated display logic.

## Rendering Differences from Regular Notes

Lithos treats daily notes differently from documentation pages in subtle but important ways to optimize the reader experience.

### Template Variations

Documentation pages typically use a dense, sidebar-heavy layout optimized for reference material and quick navigation. Daily notes, on the other hand, benefit from a cleaner, more spacious layout that emphasizes readability and immersion. You can create a custom page template that detects `isDailyNote` and adjusts the layout accordingly, such as widening the content column, removing the table of contents, or adding a publication date header.

In your `[...slug].vue` page component, you can check the `isDailyNote` flag in the page data and conditionally render different layouts. This allows you to maintain a consistent design system while tailoring the reading experience to the content type. Documentation feels like a reference manual; blog posts feel like articles.

### Metadata Display and Bylines

Daily notes often benefit from prominent date display. Unlike documentation pages where the title is paramount, journal entries gain context from their temporal position. Adding a byline component that displays the `displayDate` ("Monday, January 27, 2025") at the top of the post immediately orients the reader.

You might also add social sharing buttons, estimated reading time, or tag pills—all features more common in blog layouts than documentation. The [[Backlinks]] system, while useful for both types of content, takes on a different flavor in daily notes. Backlinks in a journal entry might reveal recurring themes or topics that span multiple days, creating a narrative web of thought.

### SEO and Open Graph Tags

Search engines and social media platforms expect different metadata from blog posts versus documentation. Daily notes benefit from Open Graph image tags (using the `cover` field), Twitter Card metadata, and structured data markup (JSON-LD) indicating an article type. Lithos can generate these tags automatically based on the `isDailyNote` flag, ensuring your journal entries look polished when shared on social media.

Documentation pages, conversely, might prioritize breadcrumb schema, software application metadata, or how-to schema, depending on the content. By differentiating daily notes at the rendering level, Lithos ensures each content type is optimized for its intended discovery and consumption pattern.

> [!tip]
> Use the [[Interactive Graph]] to visualize connections between your daily notes and other content. Journal entries often reference evergreen notes, creating a beautiful web of thought evolution over time.

> [!note]
> Daily notes are automatically excluded from the main documentation navigation but appear in the RSS feed and search results. This keeps your docs focused while making your blog discoverable.
