---
description: Sanitize the vault for Lithos (Usage: /sanitize-vault <VaultPath>)
---
Run the sanitization script on the vault to ensure Lithos compatibility (fixes quotes in frontmatter).

Command:
`node /Users/jwintz/Syntropment/lithos/scripts/sanitize-vault.mjs "$1"`

After running:
1. Report fixed files.
2. Check for remaining issues.
3. Remind the user to commit changes.
