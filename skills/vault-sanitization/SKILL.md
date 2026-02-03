# Skill: Vault Sanitization

This skill provides automated sanitization of Obsidian vaults to ensure compatibility with Lithos static site generation.

## Purpose

Fixes common issues in vault markdown files that cause rendering problems:
- **Unescaped quotes in frontmatter titles**: Causes YAML parsing errors and truncated titles in navigation.
- **Malformed YAML frontmatter**: Prevents proper metadata extraction.

## When to Use

Apply this skill when:
- User reports truncated or broken titles in the generated site
- Preparing a vault for first-time Lithos generation
- After importing notes from other systems
- Before deploying to production

## Prompt Template

Type `/sanitize-vault` to use the template located at `~/Syntropment/lithos/prompts/sanitize-vault.md`.

## Automated Script

The project includes `scripts/sanitize-vault.mjs` which automatically scans and fixes issues.

### Usage

```bash
# Sanitize a specific vault
node ~/Syntropment/lithos/scripts/sanitize-vault.mjs <vault-path>

# Example
node ~/Syntropment/lithos/scripts/sanitize-vault.mjs /Users/jwintz/Library/Mobile\ Documents/iCloud~md~obsidian/Documents/Academic
```

### What It Fixes

1. **Unescaped Double Quotes in Titles**
   - Before: `title: My "Great" Note`
   - After: `title: 'My "Great" Note'`
   
2. **Double-Quoted Titles with Internal Quotes**
   - Before: `title: "The "Best" Guide"`
   - After: `title: 'The "Best" Guide'` (or escaped if single quotes exist)

3. **Bare Strings with Quotes**
   - Before: `title: Part 1: The "Beginning"`
   - After: `title: 'Part 1: The "Beginning"'`

### Output

The script will:
- Scan all `.md` files (excluding `.obsidian/`)
- Report files scanned and fixed
- List specific issues found in each file
- Modify files in-place (create backups manually if needed)

## Manual Instructions (Fallback)

If the automated script is not available or you need to fix a single file:

### Step 1: Identify Problematic Titles

```bash
# Find titles with unescaped quotes
grep -r '^title:.*".*"' <vault-path> --include="*.md"
```

### Step 2: Fix Frontmatter

For each file with problematic titles:
1. Open in text editor
2. Locate the `title:` line in frontmatter
3. If title contains `"`, wrap in single quotes `'` or escape with `\"`
4. Save file

Example fixes:
```yaml
# BAD
title: My "Great" Note
title: Part 1: The "Beginning"

# GOOD  
title: 'My "Great" Note'
title: 'Part 1: The "Beginning"'
# OR
title: "My \"Great\" Note"
```

### Step 3: Verify H1 Alignment (Optional)

Ensure the first H1 in the document matches the frontmatter title to avoid duplication in rendered output.

## Testing After Sanitization

1. **Development Server**:
   ```bash
   npm run dev
   ```
   Navigate to previously broken pages and verify titles render correctly.

2. **Static Generation** (if memory permits):
   ```bash
   npm run generate
   ```
   Check `dist/` output for correct title rendering.

## Notes

- The script modifies files in-place. Consider creating a git commit or backup before running.
- Large vaults may take several seconds to process.
- The script is safe to run multiple times (idempotent).
- Does not fix H1 duplication automatically (requires semantic understanding of title intent).

## Troubleshooting

**Issue**: Script reports "Unclosed frontmatter block"
- **Fix**: Manually add closing `---` to the frontmatter

**Issue**: Titles still truncated after sanitization
- **Cause**: May be caused by other special characters (e.g., colons, pipes)
- **Fix**: Ensure entire title is quoted if it contains YAML special chars: `: [ ] { } > | * & ! % @ \``

**Issue**: Build still fails with OOM
- **Cause**: Lithos static generation has memory limits on very large vaults
- **Workaround**: Use development server (`npm run dev`) or consider incremental generation strategies
