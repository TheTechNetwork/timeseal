#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"
UNLOCK_HOURS="${2:-1}"

echo "Testing seal creation on $API_URL"
echo "Unlock time: +$UNLOCK_HOURS hours"

UNLOCK_TIME=$(($(date +%s) * 1000 + UNLOCK_HOURS * 3600000))

TEMP_FILE=$(mktemp)
echo "Test message" > "$TEMP_FILE"

RESPONSE=$(curl -s -X POST "$API_URL/api/create-seal" \
  -F "encryptedBlob=@$TEMP_FILE" \
  -F "keyB=$(openssl rand -base64 32 | tr -d '\n')" \
  -F "iv=$(openssl rand -base64 12 | tr -d '\n')" \
  -F "unlockTime=$UNLOCK_TIME" \
  -F "isDMS=false")

rm "$TEMP_FILE"

echo "$RESPONSE" | jq .

if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  SEAL_ID=$(echo "$RESPONSE" | jq -r '.sealId')
  echo ""
  echo "Seal created successfully"
  echo "Seal ID: $SEAL_ID"
  echo "Vault URL: $API_URL/v/$SEAL_ID"
else
  echo ""
  echo "Seal creation failed"
  exit 1
fi
