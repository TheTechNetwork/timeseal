#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"
PULSE_TOKEN="${2}"

if [ -z "$PULSE_TOKEN" ]; then
  echo "Usage: $0 [API_URL] PULSE_TOKEN"
  exit 1
fi

echo "Testing pulse status on $API_URL"

RESPONSE=$(curl -s -X POST "$API_URL/api/pulse/status" \
  -H "Content-Type: application/json" \
  -d "{\"pulseToken\": \"$PULSE_TOKEN\"}")

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.sealId' > /dev/null 2>&1; then
  echo ""
  echo "Pulse status retrieved successfully"
else
  echo ""
  echo "Pulse status failed"
  exit 1
fi
