#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"
MAX_VIEWS="${2:-3}"

echo "Testing ephemeral seal creation on $API_URL"
echo "Max views: $MAX_VIEWS"

UNLOCK_TIME=$(($(date +%s) * 1000 + 120000))

TEMP_FILE=$(mktemp)
echo "Ephemeral test message" > "$TEMP_FILE"

RESPONSE=$(curl -s -X POST "$API_URL/api/create-seal" \
  -F "encryptedBlob=@$TEMP_FILE" \
  -F "keyB=$(openssl rand -base64 32 | tr -d '\n')" \
  -F "iv=$(openssl rand -base64 12 | tr -d '\n')" \
  -F "unlockTime=$UNLOCK_TIME" \
  -F "isDMS=false" \
  -F "isEphemeral=true" \
  -F "maxViews=$MAX_VIEWS")

rm "$TEMP_FILE"

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  SEAL_ID=$(echo "$RESPONSE" | jq -r '.sealId')
  echo ""
  echo "Ephemeral seal created successfully"
  echo "Seal ID: $SEAL_ID"
  echo "Max views: $MAX_VIEWS"
  echo "Unlocks in: 1 minute"
else
  echo ""
  echo "Ephemeral seal creation failed"
  exit 1
fi
