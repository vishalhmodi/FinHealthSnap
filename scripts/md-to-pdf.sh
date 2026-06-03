#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <path-to-markdown-file>"
    echo "Example: $0 docs/Application-Setup_mac.md"
    exit 1
fi

MD_FILE="$1"

if [ ! -f "$MD_FILE" ]; then
    echo "Error: File '$MD_FILE' not found."
    exit 1
fi

echo "Converting $MD_FILE to PDF..."
# We run md-to-pdf from the directory of the file, or simply pass the file path.
# md-to-pdf places the output in the same directory by default.
npx -y md-to-pdf "$MD_FILE"

echo "Done! The PDF has been created in the same directory as the markdown file."
