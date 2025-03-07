import os
import re

def read_header_template():
    with open('header_template.html', 'r') as f:
        return f.read()

def update_file_header(filename, header_template):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Find the existing header
    start = content.find('<header class="header">')
    if start == -1:
        return
    
    end = content.find('</header>', start) + 9
    
    # Replace the header while preserving any active states
    new_content = content[:start] + header_template + content[end:]
    
    # If this is the current page, mark its nav item as active
    page_name = os.path.basename(filename)
    if page_name in new_content:
        new_content = new_content.replace(
            f'href="{page_name}"',
            f'href="{page_name}" class="active"'
        )
    
    with open(filename, 'w') as f:
        f.write(new_content)

def main():
    header_template = read_header_template()
    html_files = [f for f in os.listdir('.') if f.endswith('.html')]
    
    for filename in html_files:
        update_file_header(filename, header_template)

if __name__ == '__main__':
    main()
