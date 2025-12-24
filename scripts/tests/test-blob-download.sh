#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"
SEAL_ID="${2}"

if [ -z "${SEAL_ID}" ]; then
	echo "Usage: $0 [API_URL] SEAL_ID"
	exit 1
fi

echo "Testing blob download on $API_URL"
echo "Seal ID: $SEAL_ID"

HTTP_CODE=$(curl -s -o /tmp/blob-test.bin -w "%{http_code}" "${API_URL}/api/seal/${SEAL_ID}/blob")

if [ "${HTTP_CODE}" = "200" ]; then
	SIZE=$(stat -f%z /tmp/blob-test.bin 2>/dev/null || stat -c%s /tmp/blob-test.bin)
	echo ""
	echo "Blob downloaded successfully"
	echo "Size: ${SIZE} bytes"
	rm /tmp/blob-test.bin
elif [ "${HTTP_CODE}" = "403" ]; then
	echo ""
	echo "Blob locked (expected if seal not unlocked)"
else
	echo ""
	echo "Blob download failed (HTTP ${HTTP_CODE})"
	exit 1
fi
