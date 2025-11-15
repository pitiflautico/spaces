#!/bin/bash

# Test script for Local Automation Daemon endpoints

BASE_URL="http://localhost:5050"

echo "🧪 Testing Local Automation Daemon Endpoints"
echo "============================================="
echo ""

# Test 1: Health check
echo "✓ Test 1: GET /health"
curl -s "$BASE_URL/health" | jq . || echo "❌ Failed"
echo ""

# Test 2: List simulators
echo "✓ Test 2: GET /list-simulators"
curl -s "$BASE_URL/list-simulators" | jq . || echo "❌ Failed"
echo ""

# Test 3: Boot simulator (uncomment to test - requires Xcode)
# echo "✓ Test 3: POST /boot-simulator"
# curl -s -X POST "$BASE_URL/boot-simulator" \
#   -H "Content-Type: application/json" \
#   -d '{"device": "iPhone 15 Pro"}' | jq .
# echo ""

echo "============================================="
echo "✅ Basic tests completed"
echo ""
echo "Note: Simulator-dependent tests are commented out"
echo "Uncomment them if you have Xcode & simulators installed"
