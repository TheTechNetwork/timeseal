#!/bin/bash
set -e

echo "🔨 Building for Cloudflare Pages..."
npx @cloudflare/next-on-pages

echo "🌐 Deploying to Cloudflare Pages..."
npx wrangler pages deploy .vercel/output/static \
  --project-name=time-seal \
  --branch=master \
  --commit-dirty=true

echo "✅ Deployed!"
echo "🔗 https://time-seal.pages.dev"
