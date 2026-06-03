#!/bin/bash

# Navigate to the directory containing finhealthsnap-release.tar
if [ -f "$(dirname "$0")/finhealthsnap-release.tar" ]; then
    cd "$(dirname "$0")"
elif [ -f "$(dirname "$0")/../finhealthsnap-release.tar" ]; then
    cd "$(dirname "$0")/.."
fi

echo "Loading FinHealthSnap Docker image. This may take a few minutes..."
docker load -i finhealthsnap-release.tar

echo ""
echo "Load complete."
read -n 1 -s -r -p "Press any key to exit..."
echo ""
