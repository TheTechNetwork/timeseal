#!/bin/bash

echo "TimeSeal Deployment Script"
echo "=========================="

# Clean cache first
echo "[1/6] Cleaning build cache..."
rm -rf .next .open-next
echo "Cache cleared"

# Safety checks
echo "[2/6] Running lint..."
if ! npm run lint; then
  echo "ERROR: Lint failed"
  exit 1
fi

echo "[3/6] Type checking..."
if ! npx tsc --noEmit; then
  echo "ERROR: Type check failed"
  exit 1
fi

echo "[4/6] Building..."
if ! npx @opennextjs/cloudflare build; then
  echo "ERROR: Build failed"
  exit 1
fi

echo "[5/6] Checking build output..."
if [[ ! -d ".open-next" ]]; then
  echo "ERROR: Build failed - .open-next directory not found"
  exit 1
fi

echo "[6/6] Deploying to Cloudflare..."
if ! npx wrangler deploy; then
  echo "ERROR: Deploy failed"
  exit 1
fi

echo "SUCCESS: Deployment complete!"
echo "Live at: https://timeseal.teycir-932.workers.dev"
echo ""
echo "NOTE: Clear browser cache (Ctrl+Shift+R) to see changes"
