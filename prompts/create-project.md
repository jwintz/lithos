---
description: Create a new project reference (Usage: /create-project <ProjectName>)
---
Gather context from the repository (README, package.json, git log).

Create a new file in `Project/` with the filename `$1.md`.

Frontmatter:
```yaml
---
title: '$1'
description: '(One-sentence project description)'
tags:
  - (infer tags)
team: (infer team)
status: active | archived | planned
started: YYYY-MM-DD
repository: (url)
documentation: (url)
order: (infer from context)
icon: i-lucide-(infer icon)
navigation:
  icon: i-lucide-(infer icon)
---
```

Content Structure:
## Team
| Role | Member | Affiliation |
|------|--------|-------------|
| Lead | {name} | {affiliation} |

## Domain
{Describe the scientific/technical domain}

## Context
{Describe the ecosystem and motivation}

## Problem Statement
{Clear articulation: "I aim to solve X for Y by doing Z"}

### Challenges
1. **{Challenge}**: {description}

## Approach
### Architecture
{High-level description}

### Key Components
| Component | Purpose | Technology |
|-----------|---------|------------|
| {name} | {purpose} | {tech stack} |

## Technology Stack
- {technology} - {purpose}

## Roadmap
- [ ] {Milestone}

## Related
- [[Project/{related}]] (only if exists)

## References
1. [{Name}]({url})
