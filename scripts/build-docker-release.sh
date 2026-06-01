#!/bin/bash
set -e

# Change to the root of the project
cd "$(dirname "$0")/.."

# Get current date in YYYYMMDD format
DATE=$(date +%Y%m%d)
BASE_DIR="releases"
PREFIX="FinHealthSnap_App"

# Ensure the releases directory exists
mkdir -p "$BASE_DIR"

# Determine the sequence suffix
if [ ! -d "$BASE_DIR/${PREFIX}-${DATE}" ]; then
  SUFFIX="${DATE}"
else
  COUNTER=1
  while [ -d "$BASE_DIR/${PREFIX}-${DATE}-$(printf "%02d" $COUNTER)" ]; do
    COUNTER=$((COUNTER+1))
  done
  SUFFIX="${DATE}-$(printf "%02d" $COUNTER)"
fi

RELEASE_DIR="$BASE_DIR/${PREFIX}-${SUFFIX}"
mkdir -p "$RELEASE_DIR"

echo "=================================================="
echo "Creating release package in: $RELEASE_DIR"
echo "=================================================="

IMAGE_NAME="finhealthsnap-release:${SUFFIX}"

echo ""
echo "-> Building Docker image: ${IMAGE_NAME}"
# Build the image using buildx for amd64 architecture
docker buildx build --platform linux/amd64 -t "${IMAGE_NAME}" --load .

echo ""
echo "-> Exporting Docker image to ${RELEASE_DIR}/finhealthsnap-release.tar"
docker save -o "${RELEASE_DIR}/finhealthsnap-release.tar" "${IMAGE_NAME}"

echo ""
echo "-> Generating docker-compose.yml"
cat << EOF > "${RELEASE_DIR}/docker-compose.yml"
version: '3.8'
services:
  finhealthsnap:
    image: ${IMAGE_NAME}
    container_name: finhealthsnap
    ports:
      - "3005:3000"
    environment:
      - DATABASE_URL=file:/app/prisma/dev.db
      - NEXTAUTH_SECRET=your-secure-secret-key-change-me
      - JWT_SECRET=your-secure-jwt-key-change-me
      - NEXTAUTH_URL=http://localhost:3005
    volumes:
      # Option 1: Permanent isolated database inside Docker (Blank Start)
      # Recommended for new users who don't have existing data.
      - finhealth-db:/app/prisma
      
      # Option 2: Share an existing dev.db file
      # If the user already has a dev.db file, they should place it in a 'prisma' folder next to this file.
      # To use Option 2: comment out Option 1 above, uncomment Option 2 below, and DELETE the entire 'volumes:' section at the very bottom of this file.
      # - ./prisma:/app/prisma
    restart: unless-stopped

volumes:
  finhealth-db:
EOF

echo ""
echo "=================================================="
echo "Success! Release package is ready:"
echo "Location: $(pwd)/${RELEASE_DIR}"
echo "=================================================="
