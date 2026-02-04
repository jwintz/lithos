#!/usr/bin/env node

/**
 * Lithos CLI
 *
 * Generate static documentation sites from Obsidian vaults.
 *
 * Usage:
 *   lithos generate --vault ~/Vaults/MyVault --output ./dist
 *   lithos dev --vault ~/Vaults/MyVault
 *   lithos generate  (defaults: vault=./content, output=.output/public)
 */

import { execSync } from 'child_process'
import { resolve } from 'path'
import { existsSync, lstatSync, symlinkSync, unlinkSync, readlinkSync, readFileSync } from 'fs'

const args = process.argv.slice(2)
const command = args[0]

function parseFlag(flag) {
  // Support both --flag=value and --flag value formats
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    // Check --flag=value format
    if (arg.startsWith(`${flag}=`)) {
      return arg.slice(flag.length + 1)
    }
    // Check --flag value format
    if (arg === flag && i + 1 < args.length) {
      return args[i + 1]
    }
  }
  return null
}

const vaultPath = parseFlag('--vault')
const outputPath = parseFlag('--output')

const HELP = `
Lithos - Transform Obsidian vaults into static documentation sites

Usage:
  lithos <command> [options]

Commands:
  generate    Generate a static site from the vault
  dev         Start development server with hot reload
  build       Build for production (SSR mode)
  preview     Preview a production build locally
  cleanup     Remove all build caches and output directories

Options:
  --vault <path>    Path to Obsidian vault (default: ./content symlink target)
  --output <path>   Output directory for generate (default: .output/public)

Examples:
  lithos generate --vault ~/Vaults/MyVault --output ./dist
  lithos dev --vault ~/Vaults/MyVault
  lithos generate
`

if (!command || !['generate', 'dev', 'build', 'preview', 'cleanup'].includes(command)) {
  console.log(HELP)
  process.exit(command ? 1 : 0)
}

// Handle cleanup command
if (command === 'cleanup') {
  const { rmSync, existsSync } = await import('fs')
  const paths = [
    '.output',
    '.data',
    '.nuxt',
    'node_modules/.cache/nuxt',
    'node_modules/.vite',
  ]
  
  console.log('[Lithos] Cleaning up build caches and output directories...\n')
  
  for (const p of paths) {
    const resolved = resolve(p)
    if (existsSync(resolved)) {
      try {
        rmSync(resolved, { recursive: true, force: true })
        console.log(`  ✓ Removed ${p}`)
      } catch (e) {
        console.log(`  ✗ Failed to remove ${p}: ${e.message}`)
      }
    } else {
      console.log(`  - ${p} (not found)`)
    }
  }
  
  console.log('\n[Lithos] Cleanup complete!')
  process.exit(0)
}

// Set up vault symlink if --vault provided
if (vaultPath) {
  // Expand tilde to home directory
  const expandedPath = vaultPath.startsWith('~/')
    ? vaultPath.replace('~', process.env.HOME)
    : vaultPath
  const resolvedVault = resolve(expandedPath)
  if (!existsSync(resolvedVault)) {
    console.error(`Error: Vault path does not exist: ${resolvedVault}`)
    process.exit(1)
  }

  // Export vault path as env var for nuxt.config.ts
  process.env.LITHOS_VAULT_PATH = resolvedVault

  const contentLink = resolve('content')
  let needsSymlink = true

  // Check if content link already exists
  try {
    const stat = lstatSync(contentLink)
    if (stat.isSymbolicLink()) {
      const currentTarget = readlinkSync(contentLink)
      if (resolve(currentTarget) === resolvedVault) {
        // Already pointing to the right place
        needsSymlink = false
      } else {
        unlinkSync(contentLink)
        console.log(`Removed old symlink: ${currentTarget}`)
      }
    } else {
      console.error('Error: ./content exists and is not a symlink. Remove it manually or use a different vault path.')
      process.exit(1)
    }
  } catch (e) {
    // Path doesn't exist, that's fine
  }
  
  if (needsSymlink) {
    symlinkSync(resolvedVault, contentLink)
    console.log(`Linked content/ -> ${resolvedVault}`)
  }
}

// Build environment variables
const env = { ...process.env }
if (outputPath) {
  env.NITRO_OUTPUT_DIR = resolve(outputPath)
  env.LITHOS_OUTPUT_PATH = resolve(outputPath)
}
if (vaultPath) {
  const expandedVaultPath = vaultPath.startsWith('~/')
    ? vaultPath.replace('~', process.env.HOME)
    : vaultPath
  env.LITHOS_VAULT_PATH = resolve(expandedVaultPath)

  // Extract site name from vault's nuxt.config.ts if it exists
  const vaultConfigPath = resolve(expandedVaultPath, 'nuxt.config.ts')
  if (existsSync(vaultConfigPath)) {
    try {
      const configContent = readFileSync(vaultConfigPath, 'utf8')
      // Simple regex to extract site.name: 'Value' or name: 'Value'
      const nameMatch = configContent.match(/name:\s*['"]([^'"]+)['"]/)
      if (nameMatch) {
        env.LITHOS_SITE_NAME = nameMatch[1]
        env.NUXT_PUBLIC_SITE_NAME = nameMatch[1]
        console.log(`[Lithos] Site name: ${nameMatch[1]}`)
      }
    } catch (e) {
      // Ignore config read errors
    }
  }
}

// Clear content cache for fresh builds (ensures hooks fire)
if (command === 'generate') {
  const { rmSync, existsSync: cacheExists } = await import('fs')
  
  // Clear Nuxt Content SQLite cache
  const dataPath = resolve('.data')
  if (cacheExists(dataPath)) {
    console.log('Clearing Nuxt Content cache for fresh build...')
    rmSync(dataPath, { recursive: true, force: true })
  }
  
  // Clear Nuxt module cache
  const cachePath = resolve('node_modules/.cache/nuxt')
  if (cacheExists(cachePath)) {
    console.log('Clearing Nuxt module cache...')
    rmSync(cachePath, { recursive: true, force: true })
  }
}


// Map command to nuxt invocation
const nuxtCmd = {
  generate: 'nuxt generate --extends docus',
  dev: 'nuxt dev --extends docus',
  build: 'nuxt build --extends docus',
  preview: 'nuxt preview'
}[command]

console.log(`Running: npx ${nuxtCmd}`)

try {
  execSync(`npx ${nuxtCmd}`, { stdio: 'inherit', env, cwd: resolve('.') })
  
  // For generate command: handle post-generation tasks
  if (command === 'generate') {
    const { cpSync, existsSync: checkExists, mkdirSync, readdirSync, lstatSync, readlinkSync } = await import('fs')
    
    const defaultOutput = resolve('.output/public')
    const finalOutput = outputPath ? resolve(outputPath) : defaultOutput
    
    // Copy static assets from default output to custom output (only if custom path provided)
    if (outputPath && checkExists(defaultOutput) && defaultOutput !== finalOutput) {
      console.log(`[Lithos] Copying static assets from ${defaultOutput} to ${finalOutput}...`)
      
      const assetDirs = ['_nuxt', '_fonts', '_builds']
      for (const dir of assetDirs) {
        const srcDir = resolve(defaultOutput, dir)
        const destDir = resolve(finalOutput, dir)
        if (checkExists(srcDir)) {
          console.log(`[Lithos] Copying ${dir}/...`)
          cpSync(srcDir, destDir, { recursive: true })
        }
      }
      
      // Also copy individual static files that might be at root
      const staticFiles = ['robots.txt', 'favicon.ico', 'favicon.svg']
      for (const file of staticFiles) {
        const srcFile = resolve(defaultOutput, file)
        const destFile = resolve(finalOutput, file)
        if (checkExists(srcFile) && !checkExists(destFile)) {
          cpSync(srcFile, destFile)
        }
      }
      
      console.log('[Lithos] Static assets copied successfully')
    }
    
    // Copy vault to _raw/ for raw file access (always do this for SSG)
    // Determine the vault path - either from --vault flag or content symlink
    let vaultToCopy = vaultPath
    if (!vaultToCopy) {
      // Check if content is a symlink and get its target
      const contentLink = resolve('content')
      try {
        if (lstatSync(contentLink).isSymbolicLink()) {
          vaultToCopy = readlinkSync(contentLink)
        }
      } catch (e) {
        // Not a symlink or doesn't exist
      }
    }
    
    if (vaultToCopy) {
      const expandedVault = vaultToCopy.startsWith('~/')
        ? vaultToCopy.replace('~', process.env.HOME)
        : vaultToCopy
      const resolvedVault = resolve(expandedVault)
      
      const rawDir = resolve(finalOutput, '_raw')
      
      if (checkExists(resolvedVault)) {
        console.log(`[Lithos] Copying vault to ${rawDir} for raw file access...`)
        mkdirSync(rawDir, { recursive: true })
        
        // Check if output is inside vault (would cause recursive copy)
        const outputInsideVault = finalOutput.startsWith(resolvedVault + '/')
        
        if (outputInsideVault) {
          // Manual copy of top-level items, skipping the output directory
          const entries = readdirSync(resolvedVault)
          for (const entry of entries) {
            // Skip hidden files and node_modules
            if (entry.startsWith('.') || entry === 'node_modules') {
              continue
            }
            const srcPath = resolve(resolvedVault, entry)
            const destPath = resolve(rawDir, entry)
            // Skip if this entry is or contains the output directory
            if (srcPath === finalOutput || finalOutput.startsWith(srcPath + '/')) {
              continue
            }
            cpSync(srcPath, destPath, { recursive: true })
          }
        } else {
          // Safe to copy directly
          cpSync(resolvedVault, rawDir, { 
            recursive: true,
            filter: (src) => {
              const name = src.split('/').pop()
              return !name.startsWith('.') && name !== 'node_modules'
            }
          })
        }
        console.log('[Lithos] Vault copied successfully')
      }
    }
  }
} catch (e) {
  console.error('[Lithos] Error:', e.message || e)
  process.exit(e.status || 1)
}
