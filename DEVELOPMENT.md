# Developer Guide

EuSai CRM runs in three environments. Each has its own database, its own secrets and its own git branch.

| Environment | Where it runs | Database | Git branch | Env file |
|---|---|---|---|---|
| **local** | your machine | Docker Postgres (`docker-compose.yml`) | feature branches | `.env.local` |
| **staging** | staging server | separate staging RDS database | `staging` | `.env.staging` |
| **production** | production EC2 | production RDS | `dev-app` | `.env.production` (or `.env`) |

Local development never touches the staging or production databases.

## Prerequisites
- Node.js 20.12 or newer
- Docker Desktop (runs Postgres and Mailpit locally)
- Git

## First-time setup
```bash
git clone https://github.com/KamleshSingh7461/eusai_crm.git
cd eusai_crm
npm install
cp .env.example .env.local
```
Optionally edit `.env.local`:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: a Google OAuth client with `http://localhost:3000/api/auth/callback/google` as a redirect URI. Only needed to test real Google login. The local dev login works without it.
- `SEED_DIRECTOR_EMAIL`: your own company Google account. The seed makes it a DIRECTOR so you can sign in.

Then:
```bash
npm run setup   # starts Postgres + Mailpit, applies migrations, seeds sample data
npm run dev     # http://localhost:3000
```
You don't need Google keys to start: the login page shows a **Local dev login** list. Click any user to sign in as them and test that role. It only exists when `APP_ENV=local` *and* the database is on your machine, so it can't appear on staging or production. Use Google keys when you need to test the real login or calendar sync.

A green **LOCAL** badge at the top of the page tells you which environment you're on. Staging shows an amber **STAGING** badge. Production shows no badge.

## Everyday commands
| Command | What it does |
|---|---|
| `npm run dev` | Dev server against your local database |
| `npm run dev:staging` | Dev server against staging (needs `.env.staging`). Use it to debug staging data. |
| `npm run services:up` / `services:down` | Start or stop local Postgres and Mailpit |
| `npm run db:migrate -- --name <change>` | Create and apply a migration after editing `prisma/schema.prisma` |
| `npm run db:seed` | Re-seed sample data (idempotent) |
| `npm run db:reset` | Wipe the local database and rebuild it from migrations and the seed |
| `npm run db:studio` | Browse the local database |
| `npm run build:local` | Production build with local env, to check a build before you push |

Emails sent locally go to Mailpit at http://localhost:8025 instead of real inboxes.

Every command goes through `scripts/env.mjs`, which:
- loads only the env file for that environment,
- blanks any key listed in `.env.example` that the file doesn't set, so values from another environment can't leak in,
- warns when a local command points at a non-local database,
- refuses `migrate dev`, `migrate reset`, `db push` and `db seed` against production.

## Changing the database schema
1. Edit `prisma/schema.prisma`.
2. Run `npm run db:migrate -- --name add_something`. This creates `prisma/migrations/<timestamp>_add_something/`.
3. Commit the schema change and the migration folder together.
4. Staging and production apply it with `prisma migrate deploy` (see [the release guide](_DEPLOYMENT_DOCS/05_ENVIRONMENTS_AND_RELEASES.md)).

Do not use `prisma db push` on a shared database. It skips migration history, which is how the old migrations stopped matching the real schema.

## Git workflow
```
feature/xyz ──PR──▶ staging ──PR──▶ dev-app
                   (staging server)  (production)
```
1. Branch off `staging`: `git checkout staging && git pull && git checkout -b feature/short-name`.
2. Open a PR into `staging`. CI (`.github/workflows/ci.yml`) applies every migration to a fresh Postgres, checks the schema has no missing migration, seeds, and builds.
3. After merging, deploy staging and test there.
4. To release, open a PR from `staging` into `dev-app`, merge it, then deploy production.
5. Urgent production fix: branch `hotfix/...` off `dev-app`, PR into `dev-app`, then merge `dev-app` back into `staging`.

`main` is no longer deployed; it stopped at 30 April. Production runs from `dev-app`.

## Adding a new environment variable
1. Add it to `.env.example` with a comment. This also makes `scripts/env.mjs` manage it.
2. If the server can't run without it, add it to the schema in `src/lib/env.ts`. Startup then fails with a clear message when it's missing.
3. Add the real value on the staging and production servers before you deploy.
4. `NEXT_PUBLIC_*` values are compiled into the browser bundle at build time, so rebuild after you change them.

## Troubleshooting
- **`.env.local not found`**: run `cp .env.example .env.local`.
- **`Invalid environment for APP_ENV=...`**: the server listed the missing or invalid keys. Fix them in that environment's env file.
- **`Query Engine ... not found`**: run `npx prisma generate`.
- **Google sign-in returns `NotInvited`**: your email isn't in the local database. Set `SEED_DIRECTOR_EMAIL` and run `npm run db:seed`.
- **`spawn UNKNOWN` from Prisma, or "An Application Control policy has blocked this file"**: Windows (Smart App Control) is blocking `schema-engine-windows.exe`. The app still runs; only migration commands are affected. Run them in Docker instead, for example:
  `docker run --rm -v "$(pwd)/prisma:/w/prisma" -w /w -e DATABASE_URL="postgresql://eusai:eusai@host.docker.internal:5432/eusai_crm?schema=public" node:20-bookworm npx -y prisma@5.10.2 migrate deploy`
- **Port 5432 already in use**: a local Postgres is already running. Stop it, or change the port mapping in `docker-compose.yml` and in `DATABASE_URL`.
