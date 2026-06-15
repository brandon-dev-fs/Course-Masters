#!/usr/bin/env bash
# garage-init.sh — One-time GarageHQ setup after first Docker Compose start.
#
# Usage:
#   chmod +x scripts/garage-init.sh
#   ./scripts/garage-init.sh
#
# After it runs, copy the printed S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY
# values into server/.env (and optionally into .env for Docker Compose).

set -euo pipefail

ADMIN_URL="http://localhost:3902"
BUCKET_NAME="course-masters"
KEY_NAME="course-masters-key"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "Waiting for Garage admin API at ${ADMIN_URL}..."
for i in $(seq 1 $MAX_RETRIES); do
  if curl -sf "${ADMIN_URL}/v1/health" > /dev/null 2>&1; then
    echo "Garage admin API is ready."
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "ERROR: Garage admin API did not become ready after $((MAX_RETRIES * RETRY_INTERVAL)) seconds." >&2
    exit 1
  fi
  echo "  Attempt $i/$MAX_RETRIES — retrying in ${RETRY_INTERVAL}s..."
  sleep "$RETRY_INTERVAL"
done

echo "Fetching Garage node ID..."
NODE_ID=$(curl -sf "${ADMIN_URL}/v1/status" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')
if [ -z "$NODE_ID" ]; then
  echo "ERROR: Could not retrieve node ID from Garage status." >&2
  exit 1
fi
echo "Node ID: ${NODE_ID}"

echo "Applying cluster layout (zone=dc1, capacity=1)..."
curl -sf -X POST "${ADMIN_URL}/v1/layout" \
  -H "Content-Type: application/json" \
  -d "{\"${NODE_ID}\":{\"zone\":\"dc1\",\"capacity\":1}}" > /dev/null

curl -sf -X POST "${ADMIN_URL}/v1/layout/apply" \
  -H "Content-Type: application/json" \
  -d '{"version":1}' > /dev/null
echo "Layout applied."

echo "Creating API key '${KEY_NAME}'..."
KEY_RESPONSE=$(curl -sf -X POST "${ADMIN_URL}/v1/key?name=${KEY_NAME}" \
  -H "Content-Type: application/json" \
  -d '{"name":"'"${KEY_NAME}"'"}')

ACCESS_KEY_ID=$(echo "$KEY_RESPONSE" | grep -o '"accessKeyId":"[^"]*"' | sed 's/"accessKeyId":"//;s/"//')
SECRET_ACCESS_KEY=$(echo "$KEY_RESPONSE" | grep -o '"secretAccessKey":"[^"]*"' | sed 's/"secretAccessKey":"//;s/"//')

if [ -z "$ACCESS_KEY_ID" ] || [ -z "$SECRET_ACCESS_KEY" ]; then
  echo "ERROR: Failed to extract key credentials from response." >&2
  echo "Response was: $KEY_RESPONSE" >&2
  exit 1
fi
echo "API key created: ${ACCESS_KEY_ID}"

echo "Creating bucket '${BUCKET_NAME}'..."
curl -sf -X POST "${ADMIN_URL}/v1/bucket" \
  -H "Content-Type: application/json" \
  -d '{"globalAlias":"'"${BUCKET_NAME}"'"}' > /dev/null

BUCKET_ID=$(curl -sf "${ADMIN_URL}/v1/bucket?globalAlias=${BUCKET_NAME}" \
  | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')

echo "Granting key read/write access to bucket '${BUCKET_NAME}'..."
curl -sf -X POST "${ADMIN_URL}/v1/bucket/allow" \
  -H "Content-Type: application/json" \
  -d "{\"bucketId\":\"${BUCKET_ID}\",\"accessKeyId\":\"${ACCESS_KEY_ID}\",\"permissions\":{\"read\":true,\"write\":true,\"owner\":false}}" > /dev/null

echo ""
echo "======================================================================"
echo " GarageHQ initialisation complete!"
echo "======================================================================"
echo ""
echo " Add the following to server/.env:"
echo ""
echo "   S3_ENDPOINT=http://localhost:3900"
echo "   S3_BUCKET=${BUCKET_NAME}"
echo "   S3_ACCESS_KEY_ID=${ACCESS_KEY_ID}"
echo "   S3_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}"
echo "   S3_REGION=garage"
echo ""
echo " For Docker Compose, also add S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY"
echo " to a .env file in the project root (docker-compose reads it automatically)."
echo "======================================================================"
