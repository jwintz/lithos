---
name: academic-project
description: Create project reference documentation for the Academic vault. Use when documenting a new software project or when a post references a project that does not exist.
---

# Academic Project Creation

Creates project reference documentation in the Academic vault.

## Vault Location

The active vault is specified by the user context (typically an absolute path). Projects are stored in `$VAULT_ROOT/Project/`.

## Critical Rules

1. **Never modify the vault without user confirmation**
2. **Deep Understanding First**: Before creating, gather comprehensive context from README, commits, architecture
3. **No Placeholder Content**: Never use `FILL`, `TODO`, or `{{placeholder}}`
4. **Only Link to Existing Documents**: In Related section, only link to documents that exist
5. **Verify Wikilinks**: After creation, list all `[[...]]` and confirm targets exist

## When to Create

- A new project begins
- A post references a project that does not exist
- Documenting an existing project for the first time

## Prompt Template

Type `/create-project` to use the template in the Lithos `prompts/` directory.

## Filename Format

```
Project/{ProjectName}.md
```

Example: `Project/Odin.md`, `Project/Emacs-Swift.md`

## Frontmatter Schema

**Crucial**: Titles must be wrapped in single quotes if they contain double quotes or special characters.

```yaml
---
title: 'Project Title'     # Use quotes
description: 'One-line summary' # Mandatory: Move first sentence here
tags:                      # Domain tags
  - iot
  - monitoring
team: string               # Team identifier
status: active | archived | planned
started: YYYY-MM-DD        # Project start date
repository: url            # Source code URL
documentation: url         # Docs URL (optional)
order: number              # Mandatory sorting order
icon: i-lucide-*           # Mandatory icon
navigation:
  icon: i-lucide-*         # Mandatory navigation icon
---
```

## Document Structure

**Note**: Do not include an H1 title or the description at the top of the body. The frontmatter title and description are used by Lithos.

```markdown
## Team

| Role | Member | Affiliation |
|------|--------|-------------|
| Lead | {name} | {affiliation} |
| Contributor | {name} | {affiliation} |

## Domain

{Describe the scientific/technical domain in 2-3 sentences. What research area does this belong to? What real-world problems does it address?}

## Context

{Describe the ecosystem and motivation. Why does this project exist? What gap does it fill? What prior work does it build upon?}

## Problem Statement

{Clear articulation: "We aim to solve X for Y by doing Z."}

### Challenges

1. **{Challenge 1}**: {description}
2. **{Challenge 2}**: {description}

## Approach

### Architecture

{High-level description of the system architecture.}

### Key Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| {name} | {purpose} | {tech stack} |

### Methodology

{Scientific/technical methodology used.}

## Technology Stack

### Frontend
- {technology} - {purpose}

### Backend
- {technology} - {purpose}

### Infrastructure
- {technology} - {purpose}

## Roadmap

- [ ] {Milestone}
- [x] {Completed}

## Publications

{List any associated papers, reports, or presentations.}

## Related

- [[Project/{related project}]] (only if exists)
- [[Research/{related research}]] (only if exists)

## References

1. [{Name}]({url}) - {brief description}
```

## Workflow

1. Gather context:
   - Repository README
   - Recent commits by owner
   - Technology stack (package.json, Cargo.toml, etc.)
   - Team information
   - Architectural patterns
2. Determine appropriate tags and status
3. Fill all applicable sections with concrete information
4. For Related section: verify each target exists before linking
5. Present the file to the user for confirmation

## Context Gathering Commands

```bash
# Read project README
cat /path/to/project/README.md

# Check package.json for dependencies
cat /path/to/project/package.json

# Recent commits
cd /path/to/project && git log --oneline -20

# Technology indicators
ls /path/to/project/
```

## Writing Style

- Technical precision: Use correct terminology
- First Person: Use "I" for personal contributions and goals ("I aim to...")
- Comprehensive: Cover all major aspects
- Factual: Base descriptions on actual project state
- Links: Use markdown for external URLs, wikilinks for internal references
