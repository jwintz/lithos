---
title: Interactive Graph
description: Visualize relationships in your knowledge base.
order: 2
icon: i-lucide-network
navigation:
  icon: i-lucide-network
---

Lithos brings the beloved **Graph View** from your local Obsidian vault directly to the web. It is not just a static image, but a fully interactive, force-directed network visualization driven by the links between your notes.

## Immersive Visualization

At the heart of the Graph View is a physics simulation that naturally clusters related concepts.

### Force-Directed Physics
We utilize a sophisticated physics engine based on [d3-force](https://d3js.org/d3-force) to layout your graph. Nodes (notes) repel each other, while links (wikilinks) act as springs pulling connected notes together. This emergent behavior often reveals clusters of knowledge that are not immediately obvious from a linear file structure.

The physics parameters—such as gravity, repulsion force, and link distance—have been extensively tuned to match the default "feel" of Obsidian's graph. This ensures that the transition from your desktop app to your published site feels natural and familiar.

### Obsidian Aesthetics
We have carefully replicated the visual style of Obsidian.
- **Node Coloring**: Regular nodes use the theme's accent color (violet). Tag nodes are greenish to stand out. The current page is distinguished by a larger size and ring border rather than color, keeping it visually prominent without breaking the palette.
- **Dynamic Labels**: Labels automatically fade in and out based on zoom level, reducing clutter when viewing the global graph but providing detail when you dive in.
- **Dark/Light Mode**: The graph automatically adapts to your site's color mode, switching seamlessly between dark backgrounds with glowing nodes and clean light themes.

### Interactive Elements
The visualization is fully interactive. You can pan horizontally and vertically to explore different regions of the graph. Pinch or scroll to zoom in for a closer look at dense clusters. Hovering over a node highlights its direct connections, dimming the rest of the graph to focus your attention on the immediate context.

## Navigation & Discovery

The graph is more than just eye candy; it is a powerful tool for navigation and serendipitous discovery.

### Click to Navigate
Every node in the graph is a functional link. Clicking on a node immediately navigates you to that page. This allows readers to traverse your documentation associatively, following threads of thought rather than a rigid table of contents.

### Local vs. Global Context
Lithos supports both **Global** and **Local** graph views.
- **Global Graph**: Displays your entire vault, perfect for the homepage or a dedicated "Graph" page to show the scope of your work.
- **Local Graph**: Can be embedded on specific pages to show only the immediate neighborhood—notes linked to and from the current page. This helps readers build a mental model of the specific topic they are reading about.

### Spatial Context
By visualizing the relationships, readers can see the "shape" of your documentation. Hub nodes (notes with many connections) naturally move to the center, indicating their importance. Peripheral nodes show edge cases or specific details. This spatial context aids in understanding the hierarchy and structure of your knowledge base without requiring explicit explanation.

## Configuration & Usage

Integrating the graph into your site is straightforward but highly customizable.

### How Links Build the Graph
Every `[[wikilink]]` you write in Obsidian becomes an edge in the graph. The more you cross-reference your notes, the richer the visualization becomes.

::tabs
  :::tabs-item{label="Obsidian Syntax" icon="i-lucide-pen-tool"}
  ```md
  See the [[Interactive Graph]] for a visual overview.
  This concept relates to [[Backlinks]] and [[Structured Data]].
  ```
  :::
  :::tabs-item{label="Graph Result" icon="i-lucide-network"}
  Each `[[wikilink]]` creates a directed edge from the current note to the target. The graph module extracts these edges at build time and serves them via `/api/graph`. Three links in a single note create three edges -- hub notes with many links naturally gravitate to the center of the visualization.
  :::
::

Since the graph requires access to the DOM and browser APIs, it is wrapped in a `<ClientOnly>` tag internally. This ensures it doesn't break during Static Site Generation (SSG) while still providing a rich interactive experience for the user.

### Customizing Appearance
You can control various aspects of the simulation via props:
- `layout`: Choose between 2D or 3D rendering modes (future roadmap).
- `depth`: For local graphs, define how many "hops" of connections to display.
- `filters`: Exclude specific folders (like 'journal' or 'templates') to keep the public graph clean and relevant.

### Performance Optimization
Rendering thousands of nodes and calculating physics in real-time can be demanding. Lithos employs several optimizations, such as efficient quadtree structures for collision detection and web worker offloading for physics calculations, ensuring that your graph remains buttery smooth even as your vault grows to thousands of notes.
