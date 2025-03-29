#!/bin/bash

# Script to add Google sign-in button to all HTML files
echo "Adding Google sign-in button to all HTML files..."

# Find all HTML files and process them
for file in $(find . -name "*.html" -not -path "./signin.html" -not -path "./signup.html" -not -path "./header_template.html"); do
  echo "Processing $file"
  
  # Use sed to add the Google sign-in button after the Contact Us link
  sed -i '' -e '/<a href="contact.html" class="nav-link"><i class="fas fa-envelope"><\/i> Contact Us<\/a>/a\
                \
                <!-- Google Sign In Button -->\
                <a href="signin.html" class="google-signin-button">\
                    <img src="images/google logo.png" alt="Google" class="google-icon">\
                    <span>Sign in</span>\
                </a>' "$file"
done

echo "Google sign-in button added to all HTML files."
