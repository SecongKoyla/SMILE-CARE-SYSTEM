#!/bin/bash
# Test script to verify the appointments endpoint is working

echo "=== SMILE CARE - Appointments API Test ==="
echo ""
echo "Testing backend at http://localhost:8085/api/v1/appointments"
echo ""

# Make a GET request to the appointments endpoint
echo "Making GET request..."
response=$(curl -s -w "\n%{http_code}" http://localhost:8085/api/v1/appointments)

# Extract status code (last line)
status_code=$(echo "$response" | tail -1)

# Extract body (everything except last line)
body=$(echo "$response" | head -1)

echo "HTTP Status Code: $status_code"
echo ""
echo "Response Body:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$status_code" = "200" ]; then
    echo "✅ SUCCESS: Appointments endpoint is working!"
    count=$(echo "$body" | jq 'length' 2>/dev/null || echo "?")
    echo "   Found $count appointments"
else
    echo "❌ ERROR: Received HTTP $status_code"
    if [ "$status_code" = "500" ]; then
        echo "   Backend returned 500 error"
        echo "   Check backend logs for details"
    elif [ "$status_code" = "000" ]; then
        echo "   Connection refused - backend not running?"
    fi
fi
