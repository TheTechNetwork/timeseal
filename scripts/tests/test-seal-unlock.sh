#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"
SEAL_ID="${2}"

if [ -z "$SEAL_ID" ]; then
  echo "Usage: $0 [API_URL] SEAL_ID"
  exit 1
fi

echo "Testing seal unlock on $API_URL"
echo "Seal ID: $SEAL_ID"

RESPONSE=$(curl -s "$API_URL/api/seal/$SEAL_ID")

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.status == "unlocked"' > /dev/null 2>&1; then
  echo ""
  echo "Seal unlocked successfully"
elif echo "$RESPONSE" | jq -e '.status == "locked"' > /dev/null 2>&1; then
  UNLOCK_TIME=$(echo "$RESPONSE" | jq -r '.unlockTime')
  echo ""
  echo "Seal is locked until: $(date -d @$((UNLOCK_TIME / 1000)))"
else
  echo ""
  echo "Seal unlock failed"
  exit 1
fi
