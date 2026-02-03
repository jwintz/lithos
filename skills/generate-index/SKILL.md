---
description: Automatically generates an index.md dashboard for vaults that lack one.
---

# Index Generation Skill

This skill scans the content directory and generates a dashboard-style `index.md` if one is missing. It groups top-level folders and lists recent files.

## Usage

```bash
# Run via script
node scripts/generate-index.mjs <vault-path>
```

## Implementation

The script `scripts/generate-index.mjs` should:
1.  Check if `index.md` exists in the target vault.
2.  If missing, scan for top-level directories.
3.  Scan for recent markdown files.
4.  Generate a markdown dashboard with:
    -   Welcome message.
    -   "Spaces" section (top-level folders).
    -   "Recent Notes" section.
5.  Write the file to `index.md`.
