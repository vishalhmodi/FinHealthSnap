#!/bin/sh
set -e

# Run Prisma migrations/push to ensure the SQLite database is ready
echo "Syncing database schema..."
npx prisma db push --accept-data-loss

# Automatically seed the database if it is brand new (seed.mjs will skip if users exist)
echo "Checking if database needs to be seeded..."
node seed.mjs || true

echo "Starting Next.js application..."
exec "$@"
