#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"

echo "Testing health check on $API_URL"

RESPONSE=$(curl -s "$API_URL/api/health")

echo "$RESPONSE" | jq .

if echo "${RESPONSE}" | jq -e '.status == "healthy"' >/dev/null 2>&1; then
	echo ""
	echo "Health check passed"
else
	echo ""
	echo "Health check failed"
	exit 1
fi
