#!/bin/bash

# Script to add a single Google sign-in button to all HTML files
echo "Adding a single Google sign-in button to all HTML files..."

# Find all HTML files and process them
for file in $(find . -name "*.html" -not -path "./signin.html" -not -path "./signup.html" -not -path "./index.html"); do
  echo "Processing $file"
  
  # First, remove any existing Google sign-in buttons
  sed -i '' '/<\!-- Google Sign In Button -->/,/<\/a>/d' "$file"
  
  # Then add a single Google sign-in button after the Contact Us link
  sed -i '' -e '/<a href="contact.html" class="nav-link"><i class="fas fa-envelope"><\/i> Contact Us<\/a>/a\
                \
                <!-- Google Sign In Button -->\
                <a href="signin.html" class="google-signin-button">\
                    <img src="images/google logo.png" alt="Google" class="google-icon">\
                    <span>Sign in</span>\
                </a>' "$file"
done

echo "Single Google sign-in button added to all HTML files."
