#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"

echo "Testing analytics tracking on $API_URL"

echo ""
echo "1. Testing seal counter..."
RESPONSE=$(curl -s "$API_URL/api/stats")
echo "$RESPONSE" | jq .

if echo "${RESPONSE}" | jq -e '.totalSeals' >/dev/null 2>&1; then
	COUNT=$(echo "${RESPONSE}" | jq -r '.totalSeals')
	echo "Total seals created: $COUNT"
else
	echo "Seal counter failed"
	exit 1
fi

echo ""
echo "2. Testing activity tracking..."
RESPONSE=$(curl -s "$API_URL/api/activity")
echo "${RESPONSE}" | jq .

if echo "${RESPONSE}" | jq -e '.activities' >/dev/null 2>&1; then
	echo "Activity tracking working"
else
	echo "Activity tracking failed"
	exit 1
fi

echo ""
echo "Analytics tests completed"
