---
description: Create a new academic blog post (Usage: /create-post <ProjectName> <Title>)
---
Check that you are in the right vault.
Check that the project [[Project/$1]] exists.
If not, stop and ask the user to create the project first using the 'create-project' prompt.

Create a new file in `Blog/` with the filename format: `YYYY-MM-DD-Title-Slug.md` (derived from "$2").

Frontmatter:
```yaml
---
title: '$2'
description: 'Week X, YYYY was a {type} on {topic}, {brief context}.'
date: YYYY-MM-DD
tags:
  - (infer tags from context)
team: (infer team from project context)
type: sprint | research | tutorial
project: "[[Project/$1]]"
status: draft
order: (infer from context or use timestamp)
icon: i-lucide-(infer icon)
navigation:
  icon: i-lucide-(infer icon)
---
```

Content Structure:
## Domain
{2-3 sentences on the scientific/technical field}

## Context
{Why I am working on this, link to reference, component purpose}

## Problem
1. **{Problem Title}**
{Description of the issue}

## Approach
1. **{Problem Title}**
{Solution overview with technologies}

**Implementation:** Technical details, key files, patterns I used.

Relevant issues, commits and merge requests:
- {commit hash} - {message}

## Results
{Optional: measurable outcomes}

## References
1. [{Name}]({url}) - {description}

Finally, verify that all wikilinks in the generated file exist. List any broken links.
