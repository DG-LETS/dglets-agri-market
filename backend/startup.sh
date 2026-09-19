#!/bin/sh
# DG-LETS Backend Startup Script
# Uses prisma db push to create tables directly from schema

echo "==> Starting DG-LETS Agri Market Backend"
echo "==> Pushing database schema..."

RETRIES=5
COUNT=0

until npx prisma db push --accept-data-loss; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $RETRIES ]; then
    echo "==> Schema push failed after $RETRIES attempts. Starting server anyway..."
    break
  fi
  echo "==> Attempt $COUNT failed. Retrying in 10 seconds..."
  sleep 10
done

echo "==> Generating Prisma Client..."
npx prisma generate

echo "==> Starting NestJS server..."
node dist/main
