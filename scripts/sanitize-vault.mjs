#!/usr/bin/env node
/**
 * Vault Sanitization Script
 * 
 * Fixes common issues in Obsidian vaults that cause rendering problems in Lithos:
 * - Unescaped double quotes in frontmatter titles
 * - Malformed YAML frontmatter
 * 
 * Usage:
 *   node scripts/sanitize-vault.mjs <vault-path>
 *   node scripts/sanitize-vault.mjs ~/Vaults/MyVault
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { globbySync } from 'globby';

function sanitizeVault(vaultPath) {
  console.log(`[sanitize-vault] Scanning: ${vaultPath}`);
  
  // Find all markdown files, excluding .obsidian folder
  const files = globbySync(`${vaultPath}/**/*.md`, {
    ignore: ['**/.obsidian/**']
  });
  
  console.log(`[sanitize-vault] Found ${files.length} markdown files`);

  let fixedCount = 0;
  const issues = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      let newContent = content;
      let modified = false;
      const fileIssues = [];

      // Check if file has frontmatter
      if (!content.startsWith('---')) {
        continue;
      }

      // Extract frontmatter
      const frontmatterEnd = content.indexOf('\n---', 3);
      if (frontmatterEnd === -1) {
        fileIssues.push('Unclosed frontmatter block');
        issues.push({ file, issues: fileIssues });
        continue;
      }

      const frontmatter = content.slice(0, frontmatterEnd);
      const body = content.slice(frontmatterEnd + 4); // Skip "\n---"

      // 1. Fix title with unescaped double quotes
      const titleMatch = frontmatter.match(/^title:\s*(.*)$/m);
      
      if (titleMatch) {
        const originalTitleLine = titleMatch[0];
        const titleValue = titleMatch[1].trim();
        
        // Check if title contains double quotes
        if (titleValue.includes('"')) {
          let fixedTitleValue = titleValue;
          let needsFix = false;
          
          // Case 1: Already double-quoted but has internal quotes (needs escaping or switch to single)
          if (titleValue.startsWith('"') && titleValue.endsWith('"')) {
            const inner = titleValue.slice(1, -1);
            
            // If inner contains single quotes, escape double quotes
            if (inner.includes("'")) {
              fixedTitleValue = `"${inner.replace(/"/g, '\\"')}"`;
              needsFix = true;
              fileIssues.push('Escaped double quotes in title');
            } else {
              // Switch to single quotes (safer)
              fixedTitleValue = `'${inner}'`;
              needsFix = true;
              fileIssues.push('Converted title quotes from double to single');
            }
          } 
          // Case 2: Not quoted but contains quotes (needs wrapping)
          else if (!titleValue.startsWith('"') && !titleValue.startsWith("'")) {
            // Bare string with quotes
            if (titleValue.includes("'")) {
              // Use double quotes and escape internal double quotes
              fixedTitleValue = `"${titleValue.replace(/"/g, '\\"')}"`;
            } else {
              // Use single quotes
              fixedTitleValue = `'${titleValue}'`;
            }
            needsFix = true;
            fileIssues.push('Wrapped unquoted title containing quotes');
          }
          // Case 3: Single-quoted with internal double quotes (already safe)
          else if (titleValue.startsWith("'") && titleValue.endsWith("'")) {
            // This is fine, no fix needed
          }

          if (needsFix && fixedTitleValue !== titleValue) {
            newContent = newContent.replace(originalTitleLine, `title: ${fixedTitleValue}`);
            modified = true;
          }
        }
      }

      // 2. Check for other common YAML issues (future: could add more checks)

      if (modified) {
        writeFileSync(file, newContent, 'utf-8');
        fixedCount++;
        issues.push({ file, issues: fileIssues });
        console.log(`[sanitize-vault] Fixed: ${file}`);
      }

    } catch (err) {
      console.error(`[sanitize-vault] Error processing ${file}:`, err.message);
    }
  }

  console.log(`\n[sanitize-vault] Summary:`);
  console.log(`  Files scanned: ${files.length}`);
  console.log(`  Files fixed: ${fixedCount}`);
  
  if (issues.length > 0) {
    console.log(`\n[sanitize-vault] Issues fixed:`);
    issues.forEach(({ file, issues: fileIssues }) => {
      console.log(`  ${file}:`);
      fileIssues.forEach(issue => console.log(`    - ${issue}`));
    });
  }
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/sanitize-vault.mjs <vault-path>');
  console.error('Example: node scripts/sanitize-vault.mjs ~/Vaults/MyVault');
  process.exit(1);
}

const vaultPath = args[0];
try {
  sanitizeVault(vaultPath);
  console.log('\n[sanitize-vault] Done!');
} catch (err) {
  console.error('[sanitize-vault] Fatal error:', err);
  process.exit(1);
}
