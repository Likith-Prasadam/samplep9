#!/bin/bash
# Script to delete all artifacts from GitHub Actions to free up storage quota

# Make sure you have GitHub CLI installed: brew install gh

REPO="parabola9p9/spectra-frontend"

echo "🧹 Cleaning up GitHub Actions artifacts for $REPO..."
echo ""

# Get all artifacts
artifacts=$(gh api repos/$REPO/actions/artifacts --paginate -q '.artifacts[] | .id')

if [ -z "$artifacts" ]; then
  echo "✅ No artifacts found."
  exit 0
fi

# Count artifacts
count=$(echo "$artifacts" | wc -l | tr -d ' ')
echo "Found $count artifacts to delete."
echo ""

# Delete each artifact
echo "$artifacts" | while read artifact_id; do
  echo "Deleting artifact ID: $artifact_id"
  gh api repos/$REPO/actions/artifacts/$artifact_id -X DELETE
done

echo ""
echo "✅ All artifacts deleted successfully!"
echo "⏰ Wait 6-12 hours for storage quota to recalculate."
