#!/bin/sh
set -e

# Run Prisma migrations/push to ensure the SQLite database is ready
echo "Syncing database schema..."
npx prisma db push --accept-data-loss

# Check if there is a dev.db but no accounts yet, and maybe seed, though the user can seed manually.
# For now, just starting the server is fine because the API handles creation.

echo "Starting Next.js application..."
exec "$@"
