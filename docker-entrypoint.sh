#!/bin/sh
set -e

# Run Prisma migrations/push to ensure the SQLite database is ready
echo "Syncing database schema..."
npx prisma db push --accept-data-loss

# Automatically seed the database if it is brand new (seed.ts will skip if users exist)
echo "Checking if database needs to be seeded..."
npm run seed || true

echo "Starting Next.js application..."
exec "$@"
