#!/bin/bash
set -e

echo "🔐 TIME-SEAL Production Secrets Setup"
echo "======================================"
echo ""

# Generate master encryption key
echo "📝 Generating MASTER_ENCRYPTION_KEY..."
MASTER_KEY=$(openssl rand -base64 32)
echo "✅ Generated: $MASTER_KEY"
echo ""

# Save to local .env for reference (DO NOT COMMIT)
echo "💾 Saving to .env.local (for reference only)..."
cat > .env.local << EOF
# TIME-SEAL Production Secrets
# Generated: $(date)
# DO NOT COMMIT THIS FILE

MASTER_ENCRYPTION_KEY=$MASTER_KEY

# Optional: Turnstile (Cloudflare bot protection)
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
# TURNSTILE_SECRET_KEY=your-secret-key
EOF

echo "✅ Saved to .env.local"
echo ""

# Set in Cloudflare
echo "🌐 Setting secret in Cloudflare Pages..."
echo "$MASTER_KEY" | npx wrangler pages secret put MASTER_ENCRYPTION_KEY --project-name=time-seal

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  IMPORTANT:"
echo "  1. .env.local is in .gitignore - DO NOT commit it"
echo "  2. Store the key securely (password manager)"
echo "  3. For key rotation, see docs/KEY-ROTATION.md"
echo ""
echo "🔗 Verify at: https://dash.cloudflare.com/pages/time-seal/settings/environment-variables"
