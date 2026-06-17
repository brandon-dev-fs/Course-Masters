#!/usr/bin/env bash
# garage-init.sh — One-time GarageHQ setup after first Docker Compose start.
#
# Usage:
#   bash scripts/garage-init.sh
#
# After it runs, copy the printed S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY
# values into your root .env file (Docker Compose reads it automatically).

set -euo pipefail

BUCKET_NAME="course-masters"
KEY_NAME="course-masters-key"
MAX_RETRIES=30
RETRY_INTERVAL=2

garage() {
  MSYS_NO_PATHCONV=1 docker compose exec garage /garage "$@"
}

echo "Waiting for Garage to be ready..."
for i in $(seq 1 $MAX_RETRIES); do
  if garage status > /dev/null 2>&1; then
    echo "Garage is ready."
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "ERROR: Garage did not become ready after $((MAX_RETRIES * RETRY_INTERVAL)) seconds." >&2
    exit 1
  fi
  echo "  Attempt $i/$MAX_RETRIES — retrying in ${RETRY_INTERVAL}s..."
  sleep "$RETRY_INTERVAL"
done

echo "Fetching node ID..."
STATUS_OUTPUT=$(garage status)
echo "Garage status output:"
echo "$STATUS_OUTPUT"
NODE_ID=$(echo "$STATUS_OUTPUT" | grep -oE '[0-9a-f]{16,}' | head -1 || true)
if [ -z "$NODE_ID" ]; then
  echo "ERROR: Could not retrieve node ID." >&2
  exit 1
fi
echo "Node ID: ${NODE_ID}"

echo "Assigning layout (zone=dc1, capacity=1G)..."
garage layout assign -z dc1 -c 1G "$NODE_ID"

echo "Applying layout..."
garage layout apply --version 1

echo "Creating API key '${KEY_NAME}'..."
garage key create "$KEY_NAME" || true  # ignore if already exists

echo "Fetching key credentials..."
KEY_INFO=$(garage key info "$KEY_NAME" --show-secret)
ACCESS_KEY_ID=$(echo "$KEY_INFO" | grep 'Key ID' | awk '{print $NF}')
SECRET_ACCESS_KEY=$(echo "$KEY_INFO" | grep 'Secret key' | awk '{print $NF}')

if [ -z "$ACCESS_KEY_ID" ] || [ -z "$SECRET_ACCESS_KEY" ]; then
  echo "ERROR: Failed to extract key credentials." >&2
  echo "Key info output:" >&2
  echo "$KEY_INFO" >&2
  exit 1
fi

echo "Creating bucket '${BUCKET_NAME}'..."
garage bucket create "$BUCKET_NAME" || true  # ignore if already exists

echo "Granting key access to bucket..."
garage bucket allow --read --write "$BUCKET_NAME" --key "$KEY_NAME" || true

echo ""
echo "======================================================================"
echo " GarageHQ initialisation complete!"
echo "======================================================================"
echo ""
echo " Add the following to your root .env file:"
echo ""
echo "   S3_ACCESS_KEY_ID=${ACCESS_KEY_ID}"
echo "   S3_SECRET_ACCESS_KEY=${SECRET_ACCESS_KEY}"
echo ""
echo " Then restart the server:"
echo "   docker compose up -d --no-deps server"
echo "======================================================================"
