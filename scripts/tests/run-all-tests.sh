#!/bin/bash
set -e

API_URL="${1:-http://localhost:3000}"

echo "TimeSeal Test Suite"
echo "==================="
echo "API: ${API_URL}"
echo ""

cd "$(dirname "$0")"

echo "Test 1: Health check"
./test-health.sh "${API_URL}"
echo ""

echo "Test 2: Analytics tracking"
./test-analytics.sh "${API_URL}"
echo ""

echo "Test 3: Basic seal creation"
./test-seal-creation.sh "${API_URL}" 1
echo ""

echo "Test 4: DMS seal creation"
./test-dms-creation.sh "${API_URL}" 1
echo ""

echo "Test 5: Ephemeral seal"
./test-ephemeral-seal.sh "${API_URL}" 3
echo ""

echo "Test 6: QR code generation"
./test-qr-code.sh "${API_URL}"
echo ""

echo "Test 7: Metrics endpoint"
./test-metrics.sh "${API_URL}"
echo ""

echo "==================="
echo "All tests completed"
