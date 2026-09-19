#!/bin/sh
# DG-LETS Backend Startup Script
# Retries migration up to 5 times with increasing delays

echo "==> Starting DG-LETS Agri Market Backend"
echo "==> Running database migrations..."

RETRIES=5
COUNT=0

until npx prisma migrate deploy; do
  COUNT=$((COUNT + 1))
  if [ $COUNT -ge $RETRIES ]; then
    echo "==> Migration failed after $RETRIES attempts. Starting server anyway..."
    break
  fi
  echo "==> Migration attempt $COUNT failed. Retrying in 10 seconds..."
  sleep 10
done

echo "==> Starting NestJS server..."
node dist/main
