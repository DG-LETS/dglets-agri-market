# DG-LETS Database Backup & Restore

## Database

DG-LETS uses PostgreSQL with Prisma ORM.

The application connects to the production database through the
DATABASE_URL environment variable.

## Backup Strategy

Production database backups should be handled by the managed PostgreSQL
provider using automated database backups/snapshots.

Application secrets and DATABASE_URL must never be committed to Git.

## Manual Backup

For an authorized production database connection:

```bash
pg_dump "$DATABASE_URL" > dglets_backup_20260926_120000.sql
