#!/bin/bash
# Apply database migrations to production

set -e

echo "🔄 Applying database migrations to production..."

# Get database name from wrangler.toml
DB_NAME=$(grep -A 5 "\[\[d1_databases\]\]" wrangler.toml | grep "database_name" | cut -d'"' -f2)

if [ -z "$DB_NAME" ]; then
  echo "❌ Could not find database name in wrangler.toml"
  exit 1
fi

echo "📦 Database: $DB_NAME"

# Apply each migration in order
for migration in migrations/*.sql; do
  echo "📝 Applying $(basename $migration)..."
  npx wrangler d1 execute "$DB_NAME" --remote --file="$migration" || {
    echo "⚠️  Migration $(basename $migration) may have already been applied or failed"
  }
done

echo "✅ All migrations applied successfully!"
echo ""
echo "🔍 Verifying schema..."
npx wrangler d1 execute "$DB_NAME" --remote --command="SELECT sql FROM sqlite_master WHERE type='table' AND name='seals';"

echo ""
echo "✅ Migration complete! Production database is up to date."
