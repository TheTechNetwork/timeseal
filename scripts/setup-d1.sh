#!/bin/bash
set -e

echo "🗄️  Cloudflare D1 Database Setup"
echo "================================"
echo ""

# Create D1 database
echo "📦 Creating D1 database..."
DB_OUTPUT=$(npx wrangler d1 create time-seal-db 2>&1)
echo "$DB_OUTPUT"

# Extract database ID
DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id = "\K[^"]+' || echo "")

if [ -z "$DB_ID" ]; then
    echo "⚠️  Could not extract database ID. It may already exist."
    echo "   Check: https://dash.cloudflare.com/d1"
    DB_ID="<your-database-id>"
fi

echo ""
echo "📝 Updating wrangler.toml..."

# Update wrangler.toml with D1 binding
cat > wrangler.toml << EOF
name = "time-seal"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "time-seal-db"
database_id = "$DB_ID"
EOF

echo "✅ wrangler.toml updated"
echo ""

# Run schema
echo "🔨 Running database schema..."
npx wrangler d1 execute time-seal-db --file=schema.sql

echo ""
echo "✅ D1 Database setup complete!"
echo ""
echo "📊 Database Info:"
echo "   Name: time-seal-db"
echo "   ID: $DB_ID"
echo "   Binding: DB"
echo ""
echo "🔗 Manage at: https://dash.cloudflare.com/d1"
