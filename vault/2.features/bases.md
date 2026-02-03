---
title: Structured Data
description: Turn your vault into a queryable database.
aliases:
  - Obsidian Bases
order: 3
icon: i-lucide-database
navigation:
  icon: i-lucide-database
tags:
  - database
  - tables
  - content-management
---

Lithos transforms your static Markdown files into a dynamic, queryable database. By leveraging the **YAML frontmatter** at the top of your notes, you can treat your vault like a Content Management System (CMS), similar to Obsidian Dataview or Notion databases.

## Bases: Your Data Collections

A **Base** is simply a collection of notes that share a common context. You don't need to define a complex SQL schema; just organize your notes naturally.

### Folders as Bases
The most common way to define a Base is by folder. For instance, a `/books` folder containing review notes automatically becomes a Base. Each markdown file is a row in your database, and the properties in the frontmatter (author, rating, date read) become volume columns.

This feels natural because it matches how files are stored on disk. If you add a new book note to the folder, it automatically appears in any views querying that folder, without you needing to update a central index.

### Frontmatter as Fields
Lithos automatically parses standard types from your frontmatter:
- **Text**: Strings like names or summaries.
- **Numbers**: Ratings, prices, or counts.
- **Dates**: Published dates, deadlines (automatically sorted chronologically).
- **Tags**: Arrays of strings for categorization.
- **Booleans**: Checkbox states (completed: true/false).

This flexibility allows you to mix structured data with unstructured prose. A note can be a simple database record *or* a full-length article, or both simultaneously.

### The Standard Library
Lithos includes a "Standard Library" of field definitions to help normalize common data patterns. For example, if you use `image` or `cover`, Lithos knows to render that as an image thumbnail in gallery views. If you use `url` or `link`, it renders a clickable button. This implicit typing saves you from writing complex display logic.

## Visualization Layouts

Once your data is defined, you need powerful ways to display it. Lithos offers three primary layout engines.

### Table Layout
The **Table View** is the workhorse for dense information. It presents your notes in a spreadsheet-like grid.
- **Comparisons**: Ideal for comparing properties across many items, like a feature matrix or a software inventory.
- **Sorting**: Click column headers to sort by any property instantly.
- **Density**: Displays the maximum amount of "metadata" per pixel.

::tabs
  :::tabs-item{label="Obsidian Syntax" icon="i-lucide-pen-tool"}
  In Obsidian, create a `.base` file or use an inline base code block:
  ````md
  ```base
  folder: API Reference
  sort: title asc
  views:
    - type: table
      name: Table
  ```
  ````
  :::
  :::tabs-item{label="Rendered Output" icon="i-lucide-eye"}
  ::::obsidian-base
  ---
  folder: /API Reference
  layout: table
  sort: title
  direction: asc
  limit: 5
  ---
  ::::
  :::
::

### Grid (Card) Layout
The **Grid View** puts visuals first. It displays each note as a card, prioritizing the `cover` image and the `title`.
- **Portfolios**: Perfect for showcasing design work, photography, or products.
- **Blogs**: A classic blog roll layout with featured images and excerpts.
- **Team**: Display team member profiles with photos and roles.

The cards are responsive, adjusting their size and column count based on the device width, ensuring your gallery looks great on mobile and desktop.

### List Layout
The **List View** offers a clean, minimal representation.
- **Changelogs**: Simple chronological lists of updates.
- **Indices**: Table of contents or simple directory listings.
- **Mobile-First**: Highly readable on small screens where tables might be too wide.

## Querying & Filtering

Power users need control over exactly *what* data is displayed. Lithos provides a query syntax to slice and dice your content.

### Sorting
You can control the default sort order of any view.
- `sort="date"`: Shows the oldest notes first.
- `sort="-date"`: Shows the newest notes first (descending).
- `sort="rating"`: Sorts by numeric value.
- Multilevel sorting allows you to group items, for example, sort by `status` (To Do, In Progress) and then by `priority`.

### Limit & Pagination
For large vaults, you don't want to load thousands of notes at once.
- `limit="10"`: Only shows the top 10 results.
- **Pagination**: (Coming Soon) Automatically splits results into pages, ensuring fast load times even for massive databases.

### Advanced Filters
Future versions of Lithos will support complex filter logic directly in the component, similar to SQL `WHERE` clauses (e.g., `filter="rating > 4 AND status == 'published'"`). Currently, filtering is handled by the folder scope, but dynamic filtering is on our immediate roadmap.
