#!/bin/bash

# Navigate to the directory containing docker-compose.yml
if [ -f "$(dirname "$0")/docker-compose.yml" ]; then
    cd "$(dirname "$0")"
elif [ -f "$(dirname "$0")/../docker-compose.yml" ]; then
    cd "$(dirname "$0")/.."
fi

echo "Checking Docker container status..."

# Check if any container managed by the current docker-compose.yml is running
CONTAINER_ID=$(docker compose ps -q 2>/dev/null || echo "")

if [ -n "$CONTAINER_ID" ]; then
    echo "=================================================="
    echo "STATUS: RUNNING"
    echo "The FinHealthSnap Docker application is currently running."
    echo "=================================================="
    read -p "Would you like to STOP it? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping the application..."
        docker compose down
        echo "Application stopped successfully."
    else
        echo "Action canceled. The application remains running."
    fi
else
    echo "=================================================="
    echo "STATUS: STOPPED"
    echo "The FinHealthSnap Docker application is not currently running."
    echo "=================================================="
    echo "Starting the application..."
    docker compose up -d
    echo ""
    echo "Application started successfully in the background!"
    echo "You can access it at: http://localhost:3005 (or whichever port is configured)"
fi

echo ""
read -n 1 -s -r -p "Press any key to exit..."
echo ""
