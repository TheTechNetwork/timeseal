#!/bin/bash
# Initialize E2E Database
# This script creates a local D1 database for E2E testing and applies the schema

set -e

echo "🔧 Initializing E2E Database..."

# Create local D1 database
echo "📦 Creating local D1 database..."
npx wrangler d1 create timeseal-e2e --local || echo "Database may already exist"

# Apply schema
echo "📋 Applying schema..."
npx wrangler d1 execute timeseal-e2e --local --file=schema.sql

echo "✅ E2E Database initialized successfully!"
echo ""
echo "Database location: .wrangler/state/v3/d1/miniflare-D1DatabaseObject/"
echo ""
echo "To inspect the database:"
echo "  npx wrangler d1 execute timeseal-e2e --local --command='SELECT * FROM seals'"
