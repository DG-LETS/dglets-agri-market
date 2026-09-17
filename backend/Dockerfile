# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL dependencies (including devDeps for build)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS using local CLI
RUN npx nest build

# ── Stage 2: Production ─────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Production deps only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built output
COPY --from=builder /app/dist ./dist

# Copy Prisma client (generated)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy prisma schema for migrations
COPY prisma ./prisma

EXPOSE 3000

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
