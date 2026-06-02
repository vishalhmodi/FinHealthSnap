#!/bin/bash
set -e

# Change to the root of the project
cd "$(dirname "$0")/.."

# Check if a parameter is provided
if [ -z "$1" ]; then
  echo "Usage: ./scripts/copy-release-to-gdrive.sh <zip-file-name-or-folder>"
  echo "Example: ./scripts/copy-release-to-gdrive.sh FinHealthSnap_App-20260602-01.zip"
  exit 1
fi

FILE_NAME="$1"

# Ensure the filename has the .zip extension
if [[ ! "$FILE_NAME" == *.zip ]]; then
  FILE_NAME="${FILE_NAME}.zip"
fi

SOURCE_PATH="releases/$FILE_NAME"

if [ ! -f "$SOURCE_PATH" ]; then
  echo "Error: File not found at $SOURCE_PATH"
  exit 1
fi

# Load .env variables if the file exists
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$GOOGLE_DRIVE_RELEASE_PATH" ]; then
  echo "Error: GOOGLE_DRIVE_RELEASE_PATH is not set in your .env file."
  echo "Please uncomment it and set it to your Google Drive folder path."
  exit 1
fi

if [ ! -d "$GOOGLE_DRIVE_RELEASE_PATH" ]; then
  echo "Error: The Google Drive directory does not exist: $GOOGLE_DRIVE_RELEASE_PATH"
  echo "Make sure Google Drive is mounted and the folder path is correct."
  exit 1
fi

echo "Copying $SOURCE_PATH to Google Drive..."
cp "$SOURCE_PATH" "$GOOGLE_DRIVE_RELEASE_PATH/"
echo "Success! The release was copied to Google Drive."
