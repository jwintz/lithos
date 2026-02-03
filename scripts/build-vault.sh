#!/bin/bash
# Build a static site from an Obsidian vault
# Usage: ./scripts/build-vault.sh <vault-path> <output-name>
#
# Example:
#   ./scripts/build-vault.sh /Users/jwintz/Vaults/Vault personal
#   ./scripts/build-vault.sh /Users/jwintz/Vaults/Academic academic

set -e

VAULT_PATH="$1"
OUTPUT_NAME="$2"

if [ -z "$VAULT_PATH" ] || [ -z "$OUTPUT_NAME" ]; then
  echo "Usage: $0 <vault-path> <output-name>"
  echo "Example: $0 /Users/jwintz/Vaults/Vault personal"
  exit 1
fi

if [ ! -d "$VAULT_PATH" ]; then
  echo "Error: Vault path does not exist: $VAULT_PATH"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Building vault: $VAULT_PATH ==="
echo "Output: dist/$OUTPUT_NAME"

# Change to project directory
cd "$PROJECT_DIR"

# Update content symlink
rm -f content
ln -s "$VAULT_PATH" content
echo "Linked content -> $VAULT_PATH"

# Clear build cache
rm -rf .nuxt .output

# Generate static site
echo "Generating static site..."
npm run generate

# Move output to named directory
mkdir -p "dist"
rm -rf "dist/$OUTPUT_NAME"
mv .output/public "dist/$OUTPUT_NAME"

echo ""
echo "=== Build complete ==="
echo "Static site: dist/$OUTPUT_NAME"
echo ""
echo "To preview:"
echo "  npx serve dist/$OUTPUT_NAME"
