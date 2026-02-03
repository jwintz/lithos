---
name: academic-post
description: Create blog posts for the Academic vault. Use when the user wants to write a sprint log, research finding, or tutorial in the Blog/ folder.
---

# Academic Post Creation

Creates blog posts in the Academic vault following the established content structure.

## Vault Location

The active vault is specified by the user context (typically an absolute path). Posts are stored in `$VAULT_ROOT/Blog/`.

## Critical Rules

1. **Never modify the vault without user confirmation**
2. **Reference Before Post**: Always verify the linked Project/Research exists before creating a post
3. **No Placeholder Content**: Never use `FILL`, `TODO`, or `{{placeholder}}`
4. **Verify Wikilinks**: After creation, list all `[[...]]` and confirm targets exist

## Post Types

| Type | Purpose | Trigger |
|------|---------|---------|
| `sprint` | Development work on a project | Completed coding sprint |
| `research` | Findings from technology evaluation | Concluded research |
| `tutorial` | How-to guide | Teaching opportunity |

## Prompt Template

Type `/create-post` to use the template in the Lithos `prompts/` directory.

## Filename Format

```
Blog/YYYY-MM-DD-Title-With-Hyphens.md
```

Example: `Blog/2026-01-25-Implementing-Graph-View.md`

## Frontmatter Schema

**Crucial**: Titles must be wrapped in single quotes if they contain double quotes or special characters.

```yaml
---
title: 'My "Great" Title'  # Note the single quotes
description: 'One-line summary' # Mandatory: Move first sentence here
date: YYYY-MM-DD           # Publication date
tags:                      # Topic tags (lowercase, hyphenated)
  - frontend
  - architecture
team: string               # Team/project identifier (lowercase)
type: sprint | research | tutorial
project: "[[Project/Name]]"  # Obsidian link to project
status: draft | published
order: number              # Mandatory sorting order
icon: i-lucide-*           # Mandatory icon
navigation:
  icon: i-lucide-*         # Mandatory navigation icon
---
```

## Document Structure

**Note**: Do not include an H1 title or the opening sentence at the top of the body. The frontmatter title and description are used by Lithos.

```markdown
## Domain
{2-3 sentences on the scientific/technical field}

## Context
{Why this project exists, link to reference, component purpose}

## Problem
1. **{Problem Title}**
{Description of the issue}

2. **{Problem Title}**
{Description}

## Approach
1. **{Problem Title}**
{Solution overview with technologies}

**{Feature}:** Definition. In this context...
**Implementation:** Technical details, key files, patterns.

Relevant issues, commits and merge requests:
- {commit hash} - {message}

## Results
{Optional: measurable outcomes}

## References
1. [{Name}]({url}) - {description}
```

## Workflow

1. Identify the project being discussed
2. Check if `[[Project/{name}]]` exists in `$VAULT_ROOT/Project/`
   - If not: use the `academic-project` skill first
3. Gather context: recent commits, file changes, technologies used
4. Fill all sections with concrete information
5. Add relevant commit hashes and file paths
6. Verify all wikilinks resolve to existing files
7. Present the file to the user for confirmation

## Example Opening

```markdown
**Week 3, 2026** was a sprint on Hoodin, an action of development
for the [[Project/Odin]] project, with the Greenowl project team.
```

## Example Implementation Section

```markdown
**Implementation:** The editor is implemented in
`app/javascript/components/organisms/AlgorithmEditor.js` (395 lines).
It uses a dual-pane architecture: left for YAML configuration,
right for Python logic with real-time validation.

Relevant issues, commits and merge requests:
- `0824ce98` - Replace Ace editor with Monaco Editor
- `b3884160` - Implement real-time Python syntax validation
```

## Writing Style

- Technical precision: Use correct terminology
- Active voice: "I implemented" not "It was implemented" or "We implemented"
- Concrete examples: Show, don't just tell
- Measured claims: Avoid superlatives without evidence
