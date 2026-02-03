---
title: Backlinks
description: Discover connections through automatic bidirectional linking and visual relationship mapping.
order: 6
icon: i-lucide-link
navigation:
  icon: i-lucide-link
tags:
  - backlinks
  - navigation
  - graph
---

Backlinks are the invisible threads that connect your knowledge base into a coherent web of thought. In Obsidian, every [[wikilink]] you create automatically generates a backlink on the target page, showing you which notes reference it. Lithos brings this bidirectional linking to your published site, transforming static documentation into an interconnected network where readers can discover related content organically. This feature is essential for creating a true digital garden where ideas grow and interlink naturally.

## What Are Backlinks and Why They Matter

Backlinks represent the fundamental shift from hierarchical organization to networked knowledge.

### Beyond Linear Navigation

Traditional documentation forces readers into a predetermined path: start at the table of contents, drill down through categories, read a page, then return to the menu. This linear model works for well-structured reference material but fails for exploratory learning. Backlinks enable associative navigation, where readers follow threads of interest rather than prescribed hierarchies.

When you read a page about [[Obsidian Native]] syntax, backlinks show you every other page that references it—perhaps a guide on [[Getting Started]] that mentions syntax support, or an [[Architecture]] document explaining how syntax transformations work. These connections weren't explicitly designed into a navigation menu; they emerged naturally from the content's internal references. This organic linking creates serendipitous discovery, where readers stumble upon relevant content they didn't know to search for.

Backlinks also surface the authority and centrality of a concept. A page with dozens of backlinks is clearly important—it's a hub node in your knowledge graph. A page with few or no backlinks might be an isolated stub that needs more connections or a highly specialized leaf node. This metadata helps readers gauge the depth and relevance of content at a glance.

### Knowledge Graph Theory

The concept of backlinks originates from research on knowledge representation and graph theory. In a knowledge graph, nodes represent concepts, and edges represent relationships. A backlink is simply the inverse edge of a forward link. When page A links to page B, page B's backlink list includes page A. This bidirectional relationship creates a navigable graph rather than a one-way tree.

This structure mirrors how human memory works. We don't recall information in strict categories; we follow associative chains. Seeing a face reminds you of a place, which reminds you of a conversation, which reminds you of an idea. Backlinks enable the same associative retrieval in digital systems, making knowledge bases more intuitive and brain-friendly.

From a content strategy perspective, backlinks also enforce accountability. If you make a claim on one page and reference it from another, readers can traverse the backlink to verify the original source. This creates a self-documenting system where every assertion is inherently linked to its evidence and context.

### Discovery and Serendipity

The magic of backlinks lies in serendipity. You arrive at a page looking for specific information, but the backlinks reveal unexpected connections. A technical API reference might have backlinks from a philosophy essay, revealing how abstract concepts manifest in concrete implementations. A historical note about a project decision might be backinked from current troubleshooting guides, showing how past choices impact present challenges.

This serendipitous discovery is what separates a static knowledge base from a living digital garden. Readers don't just consume information; they explore, wander, and make their own connections. Backlinks turn documentation into a choose-your-own-adventure experience, where curiosity drives navigation more than structure.

## Automatic Backlink Detection from Wikilinks

Lithos constructs the backlink graph automatically during the build process by parsing all [[wikilinks]] in your content.

### Link Extraction in the Transform Pipeline

Every markdown file passes through the `obsidian-transform` module during Nuxt Content's `content:file:beforeParse` hook. Before transforming wikilinks into HTML, Lithos extracts the target of each link and stores it in a global map. This map, `extractedLinks`, records which pages link to which other pages, forming the raw data structure for the graph.

The extraction happens using a regex pattern that matches `[[target]]`, `[[target|alias]]`, and `[[target#section]]` formats. Only the target (the actual page being linked to) is recorded, not the alias or section. This ensures the backlink graph represents conceptual connections, not just textual references. If five different sections link to the same page with different anchors, the backlink count remains one, reflecting the conceptual relationship rather than the implementation details.

This extraction is non-destructive and happens before any transformations, ensuring it captures the raw wikilink syntax exactly as you wrote it in Obsidian. The extracted link data is then serialized to `.nuxt/extracted-links.json`, making it available to both server-side API routes and client-side components.

### Permalink Resolution and Normalization

Once links are extracted, they must be resolved to actual page paths. Obsidian allows flexible linking by filename, title, or even aliases, and Lithos replicates this behavior. The `permalinkMap` built during the `content:file:afterParse` hook maps every possible reference (lowercase filename, title, aliases) to the canonical page path.

When constructing the backlink graph, Lithos normalizes each link target by looking it up in the permalink map. If you link to `[[Getting Started]]`, Lithos resolves it to `/guide/getting-started` (stripping numeric prefixes and adjusting for folder structure). This ensures the backlink graph uses consistent paths regardless of how you reference pages in your wikilinks.

This resolution process is critical for handling edge cases. If you rename a file, update its title, or add new aliases, the permalink map reflects those changes automatically on the next build, ensuring backlinks remain accurate without manual intervention.

### Graph Data Structure

The final graph data is exposed via the `/api/graph` endpoint, which returns a JSON structure with two arrays: `nodes` (representing pages) and `edges` (representing links). Each node includes metadata like title, path, tags, and folder, while each edge specifies a `source` and `target` path.

```json
{
  "nodes": [
    {
      "id": "/features/backlinks",
      "title": "Backlinks",
      "path": "/features/backlinks",
      "folder": "features",
      "tags": ["backlinks", "navigation", "graph"]
    }
  ],
  "edges": [
    {
      "source": "/features/obsidian-syntax",
      "target": "/features/backlinks"
    }
  ]
}
```

This data structure is consumed by both the [[Interactive Graph]] visualization and the `BacklinksList` component. Using a shared API endpoint ensures consistency and caching efficiency—the graph is computed once and reused across all components.

## BacklinksList Component at Page Bottom

The `BacklinksList` component renders a clean, organized section at the bottom of each page, displaying all incoming links.

### Component Design and User Experience

The component uses a simple card-based layout, showing each backlink as a clickable tile with the source page's title and folder. The design balances information density with readability, using subtle background colors and hover states to guide the eye. A count indicator in the section header tells readers how many references exist before they scroll through the list.

The component is conditionally rendered—if a page has no backlinks, the section doesn't appear, avoiding visual clutter. This keeps the reading experience clean while surfacing connections when they exist. The component also handles loading states gracefully, showing nothing during initial load to prevent layout shifts.

By placing backlinks at the page bottom, Lithos ensures they don't interrupt the primary reading flow. Readers absorb the main content first, then discover related material as a natural next step. This placement mirrors the pattern of "See also" sections in traditional documentation, leveraging familiar UX patterns.

### Linked References Section

The section header, "Linked References," uses language borrowed from Obsidian to maintain conceptual consistency. For users transitioning from Obsidian to Lithos, this familiar terminology reduces cognitive load. For new readers, it clearly indicates the section's purpose without jargon.

The count indicator provides quick feedback. Seeing "(12)" tells readers this is a well-connected hub topic worth exploring further. Seeing "(1)" suggests a niche topic with limited cross-references. This metadata helps readers calibrate their expectations and decide whether to dive deeper or move on.

The component also applies smart filtering. Tag nodes (virtual nodes in the graph representing tags) are excluded from backlinks since they're organizational constructs, not content pages. This keeps the backlink list focused on navigable pages that readers can actually visit.

### Performance Optimization with useGraphData

Rather than fetching graph data separately for each component, Lithos uses a shared composable, `useGraphData`, which caches the graph API response across all components on a page. The `BacklinksList` component calls `useBacklinks(path)`, which internally uses `useGraphData` and filters for edges where the target matches the current page.

This caching strategy is critical for performance. Without it, a page with both a local graph widget and a backlinks list would make two identical API calls, doubling bandwidth and processing time. With caching, the graph is fetched once on the client side, then all components derive their data from the cached result.

The `useLazyFetch` composable with a fixed cache key (`graph-data`) ensures the cache persists across page navigation within the SPA lifecycle. This means navigating from one page to another doesn't refetch the graph if it's already loaded, providing instant backlink updates as readers explore your site.

## Graph Data as Source: /api/graph Endpoint

The graph API endpoint is the single source of truth for all relationship data in Lithos.

### Server-Side Graph Construction

The `/api/graph` route reads the `extracted-links.json` file generated during the build process and combines it with metadata from all pages (queried via Nuxt Content). It constructs nodes from page metadata (title, path, folder, tags) and edges from the extracted links, performing all necessary resolution and normalization on the server.

This server-side approach ensures the graph is always consistent and up-to-date. The build process writes the latest link data, and the API reads it on every request during development or statically at build time in production. There's no client-side parsing of markdown or wikilink resolution, which would be slow and error-prone.

The endpoint also handles error cases gracefully. If a link target doesn't resolve to a real page (a broken link), it's excluded from the graph rather than causing a crash. This defensive design ensures the graph remains functional even if some content is temporarily malformed or in flux.

### Data Sharing Between Graph and Backlinks

Because the `ForceGraph` component and `BacklinksList` both consume the same `/api/graph` endpoint, they're guaranteed to show consistent data. If you see a backlink in the list, the corresponding edge will exist in the graph visualization. If you click a node in the graph that links to the current page, you'll see it reflected in the backlinks section.

This consistency is achieved through architectural discipline—there is one canonical graph representation, and all features derive from it. If you wanted to add a new feature (like "outgoing links" or "similar pages"), you'd query the same endpoint and filter the data differently, maintaining the single-source-of-truth principle.

The shared data model also simplifies debugging and maintenance. If a backlink seems incorrect, you know the issue lies in link extraction or permalink resolution, not in the backlink component itself. This separation of concerns makes the system more maintainable and easier to reason about.

## Integration with the Interactive Graph

Backlinks and the [[Interactive Graph]] are two views of the same underlying data, each optimized for different discovery patterns.

### Complementary Visualization Modes

The graph provides a spatial, holistic view of your knowledge base. You see clusters, hubs, and isolated nodes at a glance. Backlinks, in contrast, provide a linear, detail-oriented list specific to the current page. Together, they offer both breadth and depth—macro and micro perspectives on your content's structure.

Readers who prefer visual thinking gravitate toward the graph, exploring by clicking nodes and observing connections spatially. Readers who prefer linear navigation use the backlinks list, scanning titles and clicking links in a familiar list format. By offering both, Lithos accommodates different cognitive styles and exploration preferences.

The graph also helps contextualize backlinks. Seeing that a page has twelve backlinks is interesting, but seeing their spatial distribution in the graph—are they all from one cluster or scattered across topics?—provides richer insight. This multi-modal representation deepens understanding of your content's interconnectedness.

### Local Graph Context in the Sidebar

While the global graph shows the entire vault, the local graph (often rendered in the right sidebar) focuses on the immediate neighborhood of the current page. It visualizes nodes within one or two hops, showing direct backlinks and their own connections. This creates a focused context map that complements the linear backlinks list.

The local graph uses the same `useLocalGraph` composable, which filters the global graph data using breadth-first search to find nearby nodes. This filtered graph excludes tag nodes and distant pages, creating a clean, relevant visualization. Readers can see at a glance how the current page fits into a cluster of related topics.

This local context is especially powerful for dense, interconnected topics. A page about [[Structured Data]] might have backlinks from API references, user guides, and design documents. The local graph visualizes these connections spatially, revealing that API references form their own cluster while user guides connect more broadly. This spatial intuition is hard to convey in a linear list.

### Bidirectional Discovery Patterns

Backlinks enable two discovery patterns: backward traversal and forward exploration. Backward traversal means arriving at a page and asking, "What led here?" Backlinks answer that question by showing source pages. Forward exploration means asking, "Where does this lead?" Outgoing links answer that, though Lithos currently focuses on backlinks.

The [[Interactive Graph]] supports a third pattern: lateral discovery. By visualizing the graph spatially, you discover connections that aren't direct backlinks—pages that share many mutual connections, forming conceptual clusters even without direct links. This is the power of network thinking: structure emerges from relationships, not just hierarchy.

> [!tip]
> Enable backlinks on your most important hub pages to show readers the breadth of their impact across your documentation. Pages with many backlinks are natural entry points for exploration.

> [!note]
> The backlink graph is built at static generation time, so dynamic content (user-generated notes, runtime embeds) won't appear until the next build. This is a deliberate tradeoff for performance and security.
