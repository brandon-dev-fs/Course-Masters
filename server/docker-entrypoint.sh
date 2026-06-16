#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema=./server/prisma/schema.prisma

if [ "${SEED_DB}" = "true" ]; then
  echo "Checking if database needs seeding..."
  USER_COUNT=$(node --input-type=module <<'EOF'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const count = await prisma.user.count();
console.log(count);
await prisma.$disconnect();
EOF
)
  if [ "$USER_COUNT" = "0" ]; then
    echo "Empty database — seeding..."
    node --import=tsx/esm server/prisma/seed.ts
  else
    echo "Database already has data (${USER_COUNT} user(s)) — skipping seed."
  fi
fi

echo "Starting server..."
exec "$@"
