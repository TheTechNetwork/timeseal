#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"
VAULT_LINK="${2:-https://timeseal.dev/v/test123}"

echo "Testing QR code generation on $API_URL"
echo "Vault link: ${VAULT_LINK}"

RESPONSE=$(curl -s -X POST "${API_URL}/api/qr" \
	-H "Content-Type: application/json" \
	-d "{\"vaultLink\": \"${VAULT_LINK}\"}")

echo "$RESPONSE" | jq .

if echo "${RESPONSE}" | jq -e '.qrCode' >/dev/null 2>&1; then
	echo ""
	echo "QR code generated successfully"
else
	echo ""
	echo "QR code generation failed"
	exit 1
fi
