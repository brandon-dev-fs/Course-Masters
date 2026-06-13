#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema=./server/prisma/schema.prisma

if [ "${SEED_DB}" = "true" ]; then
  echo "Seeding database..."
  node --import=tsx/esm server/prisma/seed.ts
fi

echo "Starting server..."
exec "$@"
