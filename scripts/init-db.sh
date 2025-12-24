#!/bin/bash
set -e

if ! command -v wrangler &> /dev/null; then
    echo "Error: wrangler not found"
    exit 1
fi

echo "Checking Cloudflare authentication..."
wrangler whoami || { echo "Error: Not authenticated. Run: wrangler login"; exit 1; }

read -p "WARNING: This will DROP and recreate the entire database. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Aborted"
    exit 0
fi

echo "Dropping existing database..."
wrangler d1 delete time-seal-db --skip-confirmation || true

echo "Creating new database..."
wrangler d1 create time-seal-db

echo "Initializing schema..."
wrangler d1 execute time-seal-db --remote --file=./scripts/init-db.sql

echo "Database created successfully"
