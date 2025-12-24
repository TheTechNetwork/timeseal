#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"
RECEIPT_FILE="${2}"

if [ -z "$RECEIPT_FILE" ]; then
  echo "Usage: $0 [API_URL] RECEIPT_FILE"
  exit 1
fi

if [ ! -f "$RECEIPT_FILE" ]; then
  echo "Receipt file not found: $RECEIPT_FILE"
  exit 1
fi

echo "Testing receipt verification on $API_URL"

RESPONSE=$(curl -s -X POST "$API_URL/api/verify-receipt" \
  -H "Content-Type: application/json" \
  -d @"$RECEIPT_FILE")

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.valid' > /dev/null 2>&1; then
  echo ""
  echo "Receipt verified successfully"
else
  echo ""
  echo "Receipt verification failed"
  exit 1
fi
