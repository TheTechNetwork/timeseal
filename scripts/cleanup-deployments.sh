#!/bin/bash
set -e

echo "🧹 Cleaning up old deployments..."

# Delete main and production preview branches via API
curl -X DELETE "https://api.cloudflare.com/client/v4/accounts/9325c2e52714914a91a29cde8e51096f/pages/projects/time-seal/deployments/4c5921f1-6020-49c0-a18e-0b6d9a6ff256" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"

curl -X DELETE "https://api.cloudflare.com/client/v4/accounts/9325c2e52714914a91a29cde8e51096f/pages/projects/time-seal/deployments/4bb7eb4f-0c3f-4445-a2a6-40154e39adfd" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"

echo "✅ Cleanup complete!"
