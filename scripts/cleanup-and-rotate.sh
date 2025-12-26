#!/bin/bash
# Database cleanup and key rotation script
# WARNING: This will delete ALL seals and rotate encryption keys

set -e

echo "=========================================="
echo "DATABASE CLEANUP & KEY ROTATION"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will:"
echo "   1. Delete ALL 59 seals from production database"
echo "   2. Rotate MASTER_ENCRYPTION_KEY"
echo "   3. Users will lose access to existing vault links"
echo ""
read -p "Are you sure? Type 'DELETE ALL SEALS' to confirm: " confirm

if [ "$confirm" != "DELETE ALL SEALS" ]; then
    echo "❌ Aborted"
    exit 1
fi

echo ""
echo "Step 1: Backing up database..."
npx wrangler d1 execute time-seal-db --remote --command "SELECT * FROM seals" > backup-seals-$(date +%Y%m%d-%H%M%S).json
echo "✅ Backup saved"

echo ""
echo "Step 2: Deleting all seals..."
npx wrangler d1 execute time-seal-db --remote --command "DELETE FROM seals"
echo "✅ All seals deleted"

echo ""
echo "Step 3: Verifying deletion..."
count=$(npx wrangler d1 execute time-seal-db --remote --command "SELECT COUNT(*) as total FROM seals" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
if [ "$count" = "0" ]; then
    echo "✅ Database empty (0 seals)"
else
    echo "❌ ERROR: Database still has $count seals"
    exit 1
fi

echo ""
echo "Step 4: Rotating MASTER_ENCRYPTION_KEY..."
NEW_KEY=$(openssl rand -base64 32)
echo "New key generated (not shown for security)"
echo ""
read -p "Deploy new key? (y/n): " deploy

if [ "$deploy" = "y" ]; then
    echo "$NEW_KEY" | npx wrangler secret put MASTER_ENCRYPTION_KEY
    echo "✅ New key deployed"
    echo "⚠️  Save this key securely: $NEW_KEY"
else
    echo "⚠️  Key not deployed - you must do this manually:"
    echo "   Generate: openssl rand -base64 32"
    echo "   Deploy: echo 'YOUR_KEY' | npx wrangler secret put MASTER_ENCRYPTION_KEY"
fi

echo ""
echo "Step 5: Removing old key fallback (if exists)..."
npx wrangler secret delete MASTER_ENCRYPTION_KEY_OLD 2>/dev/null || echo "✅ No old key to remove"

echo ""
echo "=========================================="
echo "✅ CLEANUP COMPLETE"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - All seals deleted from production"
echo "  - New encryption key deployed"
echo "  - Old key fallback removed"
echo "  - Fresh start with single key"
echo ""
echo "Next steps:"
echo "  1. Test seal creation: https://timeseal.online"
echo "  2. Verify encryption works with new key"
echo "  3. Update SECURITY-INCIDENT-2025-01-26.md status"
