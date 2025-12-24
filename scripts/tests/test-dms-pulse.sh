#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"
PULSE_TOKEN="${2}"

if [ -z "$PULSE_TOKEN" ]; then
  echo "Usage: $0 [API_URL] PULSE_TOKEN"
  exit 1
fi

echo "Testing DMS pulse on $API_URL"

RESPONSE=$(curl -s -X POST "$API_URL/api/pulse" \
  -H "Content-Type: application/json" \
  -d "{\"pulseToken\": \"$PULSE_TOKEN\"}")

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  NEW_UNLOCK=$(echo "$RESPONSE" | jq -r '.newUnlockTime')
  echo ""
  echo "Pulse successful"
  echo "New unlock time: $(date -d @$((NEW_UNLOCK / 1000)))"
else
  echo ""
  echo "Pulse failed"
  exit 1
fi
