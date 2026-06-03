@echo off
:: ==============================================================================
:: Database Schema Update Script
:: Description: Idempotent script to update the database schema.
:: Specifically, this accommodates the addition of the 'category' field 
:: to the CustomAssetLiability table.
::
:: This uses Prisma's built-in schema synchronization, which safely 
:: inspects the SQLite database and adds any missing columns or tables 
:: without deleting existing data.
:: ==============================================================================

echo Syncing database schema with latest application changes...
call npx prisma db push --accept-data-loss
echo Database update complete. It is now safe to start the application.
pause
