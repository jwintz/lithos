---
name: academic-research
description: Create research and technology evaluation documents for the Academic vault. Use when investigating new technologies, comparing alternatives, or documenting evaluation findings.
---

# Academic Research Creation

Creates research and technology evaluation documents in the Academic vault.

## Vault Location

The active vault is specified by the user context (typically an absolute path). Research documents are stored in `$VAULT_ROOT/Research/`.

## Critical Rules

1. **Never modify the vault without user confirmation**
2. **Objective Evaluation**: Present findings without bias toward any candidate
3. **No Placeholder Content**: Never use `FILL`, `TODO`, or `{{placeholder}}`
4. **Only Link to Existing Documents**: In Related section, only link to documents that exist
5. **Verify Wikilinks**: After creation, list all `[[...]]` and confirm targets exist

## When to Create

- Investigating a new technology
- Comparing alternatives before adoption
- A post references research that does not exist
- Making a technology decision that needs documentation

## Prompt Template

Type `/create-research` to use the template in the Lithos `prompts/` directory.

## Filename Format

```
Research/{Topic-Name}.md
```

Example: `Research/Emacs-Swift-Research.md`, `Research/Substrate.md`

## Frontmatter Schema

**Crucial**: Titles must be wrapped in single quotes if they contain double quotes or special characters.

```yaml
---
title: 'Research Topic'    # Use quotes
description: 'One-line summary' # Mandatory: Move first sentence here
tags:                      # Domain tags
  - editor
  - frontend
status: exploration | evaluation | concluded
started: YYYY-MM-DD
concluded: YYYY-MM-DD      # Optional, when finished
outcome: adopted | rejected | deferred
order: number              # Mandatory sorting order
icon: i-lucide-*           # Mandatory icon
navigation:
  icon: i-lucide-*         # Mandatory navigation icon
---
```

## Status Meanings

| Status | Description |
|--------|-------------|
| `exploration` | Initial investigation, gathering information |
| `evaluation` | Active comparison and testing of candidates |
| `concluded` | Decision made, research complete |

## Outcome Meanings

| Outcome | Description |
|---------|-------------|
| `adopted` | Technology/approach selected for use |
| `rejected` | Technology/approach not suitable |
| `deferred` | Decision postponed, revisit later |

## Document Structure

**Note**: Do not include an H1 title or the description at the top of the body. The frontmatter title and description are used by Lithos.

```markdown
## Motivation

{Why are we investigating this? What problem would it solve?}

## Scope

{What are we evaluating? Define boundaries.}

### Questions to Answer

1. {Question 1}
2. {Question 2}
3. {Question 3}

### Out of Scope

- {What we're explicitly not investigating}

## Candidates

### {Candidate 1}

**Overview:** {Brief description}

**Pros:**
- {advantage}
- {advantage}

**Cons:**
- {disadvantage}
- {disadvantage}

**Resources:**
- [Documentation]({url})
- [Repository]({url})

### {Candidate 2}

{Same structure}

## Evaluation Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| {criterion} | high/medium/low | {description} |

## Findings

### {Finding 1}

{Detailed findings with evidence, benchmarks, or proof-of-concept results.}

## Recommendation

**Decision:** {adopted | rejected | deferred}

**Rationale:** {Clear explanation of the decision}

## Next Steps

- [ ] {Action item if adopted}
- [ ] {Follow-up action}

## Related

- [[Project/{project this feeds into}]] (only if exists)
- [[Research/{related research}]] (only if exists)

## References

1. [{Name}]({url}) - {brief description}
```

## Workflow

1. Identify the decision being evaluated
2. List all candidates being considered
3. Define clear evaluation criteria with weights
4. Research each candidate:
   - Official documentation
   - Community feedback
   - Benchmarks if available
   - Proof of concept if needed
5. Document findings objectively
6. Provide clear recommendation with rationale
7. For Related section: verify each target exists before linking
8. Present the file to the user for confirmation

## Research Commands

Use the brave-search skill to gather information:

```bash
# Search for documentation
brave-search "{technology} documentation"

# Search for comparisons
brave-search "{technology A} vs {technology B}"

# Search for benchmarks
brave-search "{technology} performance benchmark"
```

## Writing Style

- Objective: Present facts, not opinions
- First Person: Use "I" for motivation and recommendations ("I recommend...")
- Evidence-based: Support claims with sources
- Balanced: Fair treatment of all candidates
- Actionable: Clear recommendation and next steps
