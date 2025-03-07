#!/bin/bash

# List of all HTML files
files=(
    "book-invoice.html"
    "donation-receipt.html"
    "driver-salary.html"
    "ecommerce-bill.html"
    "fuel-bill.html"
    "general-bill.html"
    "hotel-bill.html"
    "internet-bill.html"
    "lta-receipt.html"
    "rent-receipt.html"
    "restaurant-bill.html"
    "signin.html"
    "signup.html"
    "forgot-password.html"
    "otp.html"
)

for file in "${files[@]}"; do
    # Use sed to insert the Contact Us link before the auth-buttons div
    sed -i '' '/<div class="auth-buttons">/i\
                <a href="contact.html" class="nav-link"><i class="fas fa-envelope"><\/i> Contact Us<\/a>\
' "$file"
done
