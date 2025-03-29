#!/bin/bash

# Script to remove duplicate Google sign-in buttons from all HTML files
echo "Removing duplicate Google sign-in buttons from all HTML files..."

# Find all HTML files and process them
for file in $(find . -name "*.html" -not -path "./signin.html" -not -path "./signup.html"); do
  echo "Processing $file"
  
  # Use sed to remove the second Google sign-in button if it exists
  sed -i '' '/<\!-- Google Sign In Button -->/,/<\/a>/{
    /<\!-- Google Sign In Button -->/h
    /<\/a>/!d
    /<\/a>/{
      x
      /<!-- Google Sign In Button -->/!p
      s/.*//
    }
  }' "$file"
  
  # More direct approach - keep only the first occurrence
  awk '
    BEGIN { count = 0 }
    /<!-- Google Sign In Button -->/ { 
      count++; 
      if (count > 1) { 
        skip = 1;
      } else {
        print;
      }
      next;
    }
    skip == 1 && /<\/a>/ { skip = 0; next }
    skip != 1 { print }
  ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
done

echo "Duplicate Google sign-in buttons removed from all HTML files."
