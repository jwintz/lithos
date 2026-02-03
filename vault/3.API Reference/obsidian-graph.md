---
title: obsidian-graph
description: Generates and serves graph data for visualization.
order: 3
icon: i-lucide-network
navigation:
  icon: i-lucide-network
---

The `obsidian-graph` module is responsible for the interactive graph visualization features.

## Architecture

1.  **Extraction**: During build time, `obsidian-transform` extracts all links from files and saves them to `.nuxt/extracted-links.json`.
2.  **API**: This module adds a server route `/api/graph` that serves this JSON data.
3.  **Visualization**: The frontend `ForceGraph` component fetches this data to render the D3-based graph.

## API Endpoint

### `GET /api/graph`

Returns a JSON object representing the graph:

```json
{
  "nodes": [
    { "id": "/page-1", "title": "Page 1" }
  ],
  "links": [
    { "source": "/page-1", "target": "/page-2" }
  ]
}
```
