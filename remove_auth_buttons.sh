#!/bin/bash

# Script to remove auth buttons from all HTML files
echo "Removing auth buttons from all HTML files..."

# Find all HTML files and process them
for file in $(find . -name "*.html" -not -path "./signin.html" -not -path "./signup.html"); do
  echo "Processing $file"
  # Use sed to remove the auth-buttons div and its contents
  sed -i '' -E '/<div class="auth-buttons">/,/<\/div>/d' "$file"
done

echo "Auth buttons removed from all HTML files."
