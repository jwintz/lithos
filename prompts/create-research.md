---
description: Create a new research document (Usage: /create-research <Topic>)
---
Create a new file in `Research/` with the filename `Topic-Slug.md` (derived from "$1").

Frontmatter:
```yaml
---
title: '$1'
description: '(One-sentence description of the research topic)'
tags:
  - (infer tags)
status: exploration | evaluation | concluded
started: YYYY-MM-DD
outcome: adopted | rejected | deferred
order: (infer from context)
icon: i-lucide-(infer icon)
navigation:
  icon: i-lucide-(infer icon)
---
```

Content Structure:
## Motivation
{Why am I investigating this?}

## Scope
### Questions to Answer
1. {Question}

### Out of Scope
- {Item}

## Candidates
### {Candidate 1}
**Overview:** {Brief description}
**Pros:**
- {advantage}
**Cons:**
- {disadvantage}

## Evaluation Criteria
| Criterion | Weight | Description |
|-----------|--------|-------------|
| {criterion} | {weight} | {description} |

## Findings
### {Finding}
{Detailed findings}

## Recommendation
**Decision:** {outcome}
**Rationale:** {explanation}

## Next Steps
- [ ] {Action}

## Related
- [[Research/{related}]] (only if exists)
