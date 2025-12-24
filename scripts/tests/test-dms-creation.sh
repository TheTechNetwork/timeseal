#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"
UNLOCK_HOURS="${2:-7}"

echo "Testing DMS seal creation on $API_URL"
echo "Pulse interval: ${UNLOCK_HOURS} hours"

UNLOCK_TIME=$(($(date +%s) * 1000 + UNLOCK_HOURS * 3600000))
PULSE_INTERVAL=$((UNLOCK_HOURS * 3600000))

TEMP_FILE=$(mktemp)
echo "DMS test message" >"${TEMP_FILE}"

RESPONSE=$(curl -s -X POST "${API_URL}/api/create-seal" \
	-F "encryptedBlob=@${TEMP_FILE}" \
	-F "keyB=$(openssl rand -base64 32 | tr -d '\n')" \
	-F "iv=$(openssl rand -base64 12 | tr -d '\n')" \
	-F "unlockTime=${UNLOCK_TIME}" \
	-F "isDMS=true" \
	-F "pulseInterval=${PULSE_INTERVAL}")

rm "${TEMP_FILE}"

echo "${RESPONSE}" | jq .

if echo "${RESPONSE}" | jq -e '.success' >/dev/null 2>&1; then
	SEAL_ID=$(echo "${RESPONSE}" | jq -r '.sealId')
	PULSE_TOKEN=$(echo "${RESPONSE}" | jq -r '.pulseToken')
	echo ""
	echo "DMS seal created successfully"
	echo "Seal ID: ${SEAL_ID}"
	echo "Pulse token: ${PULSE_TOKEN}"
	echo ""
	echo "Test pulse with: ./test-dms-pulse.sh ${API_URL} \"${PULSE_TOKEN}\""
else
	echo ""
	echo "DMS seal creation failed"
	exit 1
fi
