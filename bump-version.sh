#!/bin/bash

# Script to automatically increment addon version before commit
# Usage: Run this script before committing changes

set -e

ADDON_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/addon"
CONFIG_YAML="$ADDON_DIR/config.yaml"
ADDONS_JSON="./addons.json"

# Get current version
CURRENT_VERSION=$(grep '^version:' "$CONFIG_YAML" | sed 's/version: //')
echo "Current version: $CURRENT_VERSION"

# Increment patch version (e.g., 1.0.0 -> 1.0.1)
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"
PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "New version: $NEW_VERSION"

# Update config.yaml
sed -i '' "s/^version: .*/version: $NEW_VERSION/" "$CONFIG_YAML"
echo "✅ Updated $CONFIG_YAML to version $NEW_VERSION"

# Update addons.json
sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" "$ADDONS_JSON"
echo "✅ Updated $ADDONS_JSON to version $NEW_VERSION"

# Update CHANGELOG.md
CHANGELOG="$ADDON_DIR/CHANGELOG.md"
TODAY=$(date '+%Y-%m-%d')

# Create temporary file with new version entry
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE" << EOF

### $NEW_VERSION ($TODAY)
-
EOF

# Insert new version entry after the header line
sed -i '' '2r '"$TEMP_FILE" "$CHANGELOG"
rm "$TEMP_FILE"
echo "✅ Updated $CHANGELOG with new version entry"

echo ""
echo "Version bump complete: $CURRENT_VERSION -> $NEW_VERSION"
echo "You can now run: git add . && git commit -m \"<your message>\""

