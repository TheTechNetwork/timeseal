#!/bin/bash
set -e

echo "🤖 Cloudflare Turnstile Setup"
echo "=============================="
echo ""
echo "⚠️  You need to get Turnstile keys from Cloudflare Dashboard first:"
echo "   https://dash.cloudflare.com/turnstile"
echo ""
echo "Steps:"
echo "  1. Click 'Add Site'"
echo "  2. Enter domain: time-seal.pages.dev"
echo "  3. Copy the Site Key and Secret Key"
echo ""

# Prompt for keys
read -p "Enter TURNSTILE_SITE_KEY (or press Enter to skip): " SITE_KEY
if [ -z "$SITE_KEY" ]; then
    echo "⏭️  Skipping Turnstile setup (using test keys)"
    exit 0
fi

read -p "Enter TURNSTILE_SECRET_KEY: " SECRET_KEY
if [ -z "$SECRET_KEY" ]; then
    echo "❌ Secret key is required"
    exit 1
fi

echo ""
echo "💾 Saving to .env.local..."
cat >> .env.local << EOF

# Cloudflare Turnstile (Bot Protection)
# Added: $(date)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=$SITE_KEY
TURNSTILE_SECRET_KEY=$SECRET_KEY
EOF

echo "✅ Saved to .env.local"
echo ""

echo "🌐 Setting secrets in Cloudflare Pages..."
echo "$SITE_KEY" | npx wrangler pages secret put NEXT_PUBLIC_TURNSTILE_SITE_KEY --project-name=time-seal
echo "$SECRET_KEY" | npx wrangler pages secret put TURNSTILE_SECRET_KEY --project-name=time-seal

echo ""
echo "✅ Turnstile setup complete!"
echo ""
echo "🔗 Verify at: https://dash.cloudflare.com/pages/time-seal/settings/environment-variables"
