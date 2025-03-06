#!/bin/bash

# The standardized menu content
MENU_CONTENT='                <div class="dropdown-content" role="menu" aria-label="Bill Types">
                    <a href="general-bill.html" role="menuitem"><i class="fas fa-file-invoice" aria-hidden="true"></i>General Bill</a>
                    <a href="hotel-bill.html" role="menuitem"><i class="fas fa-hotel" aria-hidden="true"></i>Hotel Stay Bill</a>
                    <a href="restaurant-bill.html" role="menuitem"><i class="fas fa-utensils" aria-hidden="true"></i>Restaurant Bill</a>
                    <a href="internet-bill.html" role="menuitem"><i class="fas fa-wifi" aria-hidden="true"></i>Internet Bill</a>
                    <a href="fuel-bill.html" role="menuitem"><i class="fas fa-gas-pump" aria-hidden="true"></i>Fuel Receipt</a>
                    <a href="book-invoice.html" role="menuitem"><i class="fas fa-book" aria-hidden="true"></i>Book Invoice</a>
                    <a href="driver-salary.html" role="menuitem"><i class="fas fa-car" aria-hidden="true"></i>Driver Salary</a>
                    <a href="ecommerce-bill.html" role="menuitem"><i class="fas fa-shopping-cart" aria-hidden="true"></i>E-commerce Bill</a>
                    <a href="rent-receipt.html" role="menuitem"><i class="fas fa-home" aria-hidden="true"></i>Rent Receipt</a>
                    <a href="donation-receipt.html" role="menuitem"><i class="fas fa-hand-holding-heart" aria-hidden="true"></i>Donation Receipt</a>
                    <a href="lta-receipt.html" role="menuitem"><i class="fas fa-plane" aria-hidden="true"></i>LTA Receipt</a>
                </div>'

# Function to update the menu in a file
update_menu() {
    local file=$1
    local basename=$(basename "$file" .html)
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Process the file
    awk -v menu="$MENU_CONTENT" -v basename="$basename" '
    /class="dropdown-content"/ {
        # Print everything up to this line
        print
        # Skip existing menu content
        while (getline && !/<\/div>/) {}
        # Print the new menu content, with active class for current page
        gsub(/href="'basename'.html"/, "href=\"'basename'.html\" class=\"active\"", menu)
        print menu
        next
    }
    {print}
    ' "$file" > "$temp_file"
    
    # Replace the original file with the temporary file
    mv "$temp_file" "$file"
}

# Update all HTML files
for file in *.html; do
    if [ "$file" != "index.html" ]; then
        update_menu "$file"
    fi
done

# Special handling for index.html since it has a different structure
update_menu "index.html"
