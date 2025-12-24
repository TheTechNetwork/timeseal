#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"

echo "Testing metrics endpoint on $API_URL"
echo "Note: Metrics disabled in dev (requires METRICS_SECRET)"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/metrics")

if [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "401" ]; then
  echo ""
  echo "Metrics endpoint protected (expected in dev)"
else
  echo ""
  echo "Unexpected response: HTTP $HTTP_CODE"
  exit 1
fi
