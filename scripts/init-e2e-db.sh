#!/bin/bash
# Initialize E2E Database
# This script applies schema to the local D1 database for E2E testing

set -e

echo "🔧 Initializing E2E Database..."

# Apply schema to local database
echo "📋 Applying schema to local D1 database..."
npx wrangler d1 execute DB --file=schema.sql

echo "✅ E2E Database initialized successfully!"
echo ""
echo "Database location: .wrangler/state/v3/d1/"
echo ""
echo "To inspect the database:"
echo "  npx wrangler d1 execute DB --command='SELECT * FROM seals'"
