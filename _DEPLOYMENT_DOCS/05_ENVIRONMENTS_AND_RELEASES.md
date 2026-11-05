# Environments and Releases (Staging and Production on EC2)

Staging and production are two separate servers (or two separate app directories with separate PM2 processes). They use **separate databases**, separate Google OAuth redirect URIs and separate secrets. For the local side, see [DEVELOPMENT.md](../DEVELOPMENT.md). Mobile and desktop app builds are covered in guides 01 to 03.

| | Staging | Production |
|---|---|---|
| Git branch | `staging` | `dev-app` |
| Env file on server | `.env.staging` | `.env.production` (a legacy `.env` is also read) |
| Database | staging RDS database | production RDS database |
| PM2 process | `eusai-staging` | `eusai-production` |

## 1. One-time server setup
```bash
cd ~/eusai_crm            # or ~/eusai_crm_staging on the staging box
cp .env.example .env.production    # or .env.staging
nano .env.production
```
Required on staging and production (the server refuses to start without them):
- `DATABASE_URL`: the database for this environment only
- `NEXTAUTH_URL`: the public URL, e.g. `https://crm.eusaiteam.com` / `https://staging-crm.eusaiteam.com`
- `NEXTAUTH_SECRET`: at least 32 characters, different per environment (`openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, with `<NEXTAUTH_URL>/api/auth/callback/google` added to the OAuth client's redirect URIs
- `CRON_SECRET`
- `SMTP_*`. On staging, use a test inbox or Mailpit so real staff don't get staging emails.

Create the `staging` branch once from `dev-app` (`git push origin origin/dev-app:refs/heads/staging`), and the staging database once, e.g. `CREATE DATABASE eusai_crm_staging;` on the RDS instance, or a separate RDS instance.

## 2. One-time: baseline existing databases (migration history reset)
The old `prisma/migrations` were generated for SQLite and no longer matched the real schema, so the database was kept in sync with `db push`. They have been replaced by a single PostgreSQL baseline, `prisma/migrations/0_init`.

**An existing database that already has the tables (production RDS today):** mark the baseline as applied. This does not change any tables:
```bash
npm run db:status:production                     # shows 0_init as not applied
node scripts/env.mjs production npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
#   ^ must print an empty migration. If it prints SQL, the live DB differs from schema.prisma. Stop and resolve that first.
node scripts/env.mjs production npx prisma migrate resolve --applied 0_init
```

**A brand-new empty database (staging):** apply normally with `npm run db:deploy:staging`, then optionally `npm run db:seed:staging`.

From then on, every schema change ships as a committed migration and is applied with `migrate deploy`.

## 3. Deploy (every release)
Staging (from the `staging` branch):
```bash
cd ~/eusai_crm_staging
git pull origin staging
npm ci
npm run db:deploy:staging
npm run build:staging
pm2 restart eusai-staging || pm2 start npm --name eusai-staging -- run start:staging
```

Production (from `dev-app`, after staging has been checked):
```bash
cd ~/eusai_crm
git pull origin dev-app
npm ci
npm run db:deploy:production
npm run build:production
pm2 restart eusai-production || pm2 start npm --name eusai-production -- run start:production
pm2 save
```
If the existing PM2 process was started as `npm start`, recreate it once with the `start:production` line above so it runs with `APP_ENV=production`.

Check it's up: `curl https://<host>/api/ping` should return `"env":"production"` (or `"staging"`).

## 4. Cron jobs
`/api/cron/remind-reports` needs `Authorization: Bearer <CRON_SECRET>` for that environment. Point staging's scheduler at staging, with the staging secret.

## Rules
- Never run `prisma db push`, `migrate dev` or `migrate reset` against staging or production. `scripts/env.mjs` blocks these for production.
- Never copy production secrets into `.env.local`.
- Deploy to staging first. Production gets only what passed on staging.
- Before a migration that drops or renames columns, take an RDS snapshot.

## Checklist
- [ ] Merged to the right branch (`staging` / `dev-app`) and CI is green
- [ ] `npm ci` done
- [ ] `db:deploy:<env>` applied migrations (no errors)
- [ ] `build:<env>` finished
- [ ] PM2 restarted, `/api/ping` shows the right env
- [ ] Logged in and checked the changed feature
