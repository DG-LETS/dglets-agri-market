# DG-LETS Agri Market — Deployment Guide

> **Audience:** Engineers and DevOps deploying or maintaining the DG-LETS backend and mobile app.
> **Last updated:** September 2026

---

## Overview

| Component | Technology | Deployment method |
|---|---|---|
| Backend API | NestJS 10, Dockerized | Docker image → hosting platform (Koyeb / Railway / Render) |
| Database | PostgreSQL 14+ | Managed database from hosting provider |
| Mobile app | Expo / React Native | EAS Build → APK (Android) / IPA (iOS) |
| Landing page | Static HTML/CSS/JS | Any static host (GitHub Pages, Netlify, Vercel) |
| Admin panel | Static HTML (admin/index.html) | Served from same static host as landing page |

---

## Prerequisites

- Node.js 20.x
- npm 10+
- Docker (for local image builds)
- [EAS CLI](https://docs.expo.dev/build/setup/) (`npm install -g eas-cli`) for mobile builds
- Access to the hosting platform dashboard (Koyeb / Railway / Render)
- Access to the GitHub repository (`github.com/Dglets/dglets-agri-market`)

---

## 1. Backend Deployment

### 1.1 Environment Variables

Before deploying, set **all** of the following in the hosting platform's environment / secrets dashboard.
**Never commit real secrets to git.**

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Must be `production` | `production` |
| `PORT` | Server port | `3000` |
| `CORS_ORIGIN` | Comma-separated frontend origin(s) | `https://app.dglets.com,https://dglets.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dglets` |
| `JWT_SECRET` | Strong random string ≥ 64 chars | `openssl rand -hex 64` |
| `JWT_REFRESH_SECRET` | Different strong random string | `openssl rand -hex 64` |
| `JWT_EXPIRES_IN` | Access token TTL | `7d` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL | `30d` |
| `PAYSTACK_SECRET_KEY` | Live Paystack secret key | `sk_live_...` |
| `PAYSTACK_CALLBACK_URL` | Paystack redirect after payment | `https://your-api.com/api/v1/payments/paystack/callback` |
| `TERMII_API_KEY` | Termii SMS API key | from Termii dashboard |
| `TERMII_SENDER_ID` | SMS sender name (must be approved) | `DG-LETS` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | from Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API key | from Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | from Cloudinary dashboard |

Fee/commission variables (non-secret, can be set in `koyeb.yaml`):
`PLATFORM_FEE_RATE`, `REGISTRATION_FEE_*`, `HAULAGE_COMMISSION_RATE`

### 1.2 First Deployment (Fresh Database)

```bash
# 1. Clone the repository
git clone https://github.com/Dglets/dglets-agri-market.git
cd dglets-agri-market/backend

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Generate Prisma client
npx prisma generate

# 4. ⚠️  IMPORTANT — verify migration drift before applying
#    Run this against the real DATABASE_URL first:
npx prisma migrate diff \
  --from-migrations ./prisma/migrations \
  --to-schema-datamodel ./prisma/schema.prisma \
  --shadow-database-url "$DATABASE_URL"

# 5. Apply migrations to the database (creates all tables)
npx prisma migrate deploy

# 6. (Optional) Seed initial data
npx prisma db seed

# 7. Build the application
npx nest build        # or: node node_modules/@nestjs/cli/bin/nest.js build

# 8. Start the server
node dist/main
```

### 1.3 Docker Deployment

```bash
# Build from repo root
docker build -f backend/Dockerfile -t dglets-api:latest .

# Run locally to test
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  dglets-api:latest

# The container's CMD is already:
#   npx prisma migrate deploy && node dist/main
# Migrations run automatically on startup.
```

### 1.4 Koyeb Deployment

1. Connect the GitHub repository to Koyeb
2. Select `backend/Dockerfile` as the build source
3. Set all required environment variables as **secrets** in the Koyeb dashboard
4. Set `CORS_ORIGIN` to your actual frontend URL (not `*`)
5. The health check is pre-configured in `backend/koyeb.yaml` at `/api/v1/health`
6. Koyeb will auto-deploy on every push to `master`

### 1.5 Schema Migrations (Ongoing)

When the Prisma schema changes:

```bash
# Generate a new tracked migration
npx prisma migrate dev --name describe_your_change

# This creates a new file in prisma/migrations/ — commit it to git
git add prisma/migrations/
git commit -m "feat(db): add [describe change]"
git push origin master
```

On the next deploy, `npx prisma migrate deploy` (the Docker CMD) applies the new migration automatically.

**Never use `prisma db push` or `prisma db push --accept-data-loss` in production.**

---

## 2. Health Check

Once deployed, verify the backend is running:

```bash
curl https://your-api-url/api/v1/health
```

Expected response (HTTP 200):
```json
{
  "status": "ok",
  "timestamp": "2026-09-22T10:00:00.000Z",
  "uptime": 42,
  "latencyMs": 5,
  "services": { "database": { "status": "ok" } },
  "version": "0.1.0"
}
```

HTTP 503 means the database is unreachable — check `DATABASE_URL` and network/firewall rules.

---

## 3. Mobile App Build (EAS)

### 3.1 Prerequisites

```bash
npm install -g eas-cli
eas login   # use Expo account: devdanielcodes357
```

### 3.2 Set the API URL

Update `mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://your-deployed-api-url/api/v1
```

### 3.3 Build Commands

```bash
cd mobile

# Android APK (direct install, for testing)
eas build --platform android --profile preview

# Android AAB (Play Store submission)
eas build --platform android --profile production

# iOS (requires Apple Developer account — $99/year)
eas build --platform ios --profile preview

# Both platforms at once
eas build --platform all --profile production
```

### 3.4 EAS Build Profiles

| Profile | Android output | iOS output | API URL | Use for |
|---|---|---|---|---|
| `development` | APK | — | Local IP | Dev testing with local backend |
| `preview` | APK | IPA (device) | Production | QA / stakeholder testing |
| `production` | AAB | IPA (App Store) | Production | Store submission |

---

## 4. Admin Web Panel

The admin panel is a single HTML file at `admin/index.html`.

Deploy alongside the landing page on any static host. When you open it in a browser:
1. Enter the backend API URL in the API URL bar at the top
2. Log in with an ADMIN role account
3. All data is fetched live from the backend API

---

## 5. Seeding Test Users (Development Only)

```powershell
# Requires the backend to be running at the URL in the script
.\seed-users.ps1
```

Default test credentials after seeding:

| Role | Phone | Password |
|---|---|---|
| ADMIN | 08070566642 | Admin2026! |
| FARMER | 08011111111 | Test1234! |
| BUYER | 08022222222 | Test1234! |
| HAULAGE | 08044444444 | Test1234! |

---

## 6. CI/CD

A GitHub Actions workflow runs on every push to `master` (`.github/workflows/ci.yml`):

- **Backend:** `npm ci` → `prisma generate` → `nest build` → migration file check
- **Mobile:** `npm ci` → `tsc --noEmit`

Deployment to the hosting platform is currently triggered by git push via the platform's own GitHub integration (not a separate deployment step in CI). A CD step will be added once the target platform is confirmed.

---

## 7. Rollback Procedure

If a deployment introduces a breaking change:

1. **Revert the code** — `git revert HEAD && git push origin master`
2. **Revert the migration** — Prisma does not support automatic rollback. If a migration must be undone, write a new migration that reverses the schema change (`npx prisma migrate dev --name revert_xyz`). Never manually edit `_prisma_migrations` in production.
3. **Redeploy** — the platform will rebuild and restart from the reverted commit.

---

## 8. Checklist: Go-Live

- [ ] All `REPLACE_WITH_*` placeholders replaced with real values in the hosting dashboard
- [ ] `CORS_ORIGIN` set to the actual frontend URL (not `*`)
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are strong unique values (≥ 64 chars each)
- [ ] `prisma migrate deploy` ran successfully on the production database
- [ ] `GET /api/v1/health` returns HTTP 200 with `"status": "ok"`
- [ ] Paystack webhook URL registered in the Paystack dashboard: `POST /api/v1/payments/paystack/webhook`
- [ ] Termii sender ID `DG-LETS` approved (or using an approved alternative)
- [ ] Cloudinary credentials set and upload working
- [ ] Mobile `.env` points to the production API URL
- [ ] EAS production build submitted to Play Store / App Store
- [ ] Admin panel deployed and accessible to the admin team
- [ ] Database backups confirmed active on the hosting provider
- [ ] Monitoring/error tracking configured (Sentry or equivalent — Phase 2)
