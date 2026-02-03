#!/bin/bash
# Build static sites for all test vaults
# Output: dist/personal, dist/academic

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Building all vaults ==="
echo ""

# Build personal vault
"$SCRIPT_DIR/build-vault.sh" /Users/jwintz/Vaults/Vault personal

echo ""
echo "---"
echo ""

# Build academic vault  
"$SCRIPT_DIR/build-vault.sh" /Users/jwintz/Vaults/Academic academic

echo ""
echo "=== All builds complete ==="
echo ""
echo "Preview commands:"
echo "  Personal: npx serve dist/personal -l 3001"
echo "  Academic: npx serve dist/academic -l 3002"
echo ""
echo "Or serve both with:"
echo "  npx serve dist"
