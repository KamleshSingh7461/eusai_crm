# EuSai CRM

Internal CRM and operations platform (projects, milestones, tasks, daily reports, teams and departments) built with Next.js 15, Prisma and PostgreSQL. Login uses Google.

## Quick start (local)
```bash
npm install
cp .env.example .env.local     # add Google OAuth keys and SEED_DIRECTOR_EMAIL
npm run setup                  # Docker Postgres + Mailpit, migrations, seed data
npm run dev                    # http://localhost:3000
```

## Environments
| | local | staging | production |
|---|---|---|---|
| Branch | feature branches | `staging` | `dev-app` |
| Env file | `.env.local` | `.env.staging` | `.env.production` |
| Run | `npm run dev` | `npm run build:staging && npm run start:staging` | `npm run build:production && npm run start:production` |

- [DEVELOPMENT.md](DEVELOPMENT.md): local setup, schema changes, git workflow
- [Environments and releases](_DEPLOYMENT_DOCS/05_ENVIRONMENTS_AND_RELEASES.md): staging and production deploys, one-time migration baseline
- [_DEPLOYMENT_DOCS/](_DEPLOYMENT_DOCS/): Android, Windows and Apple app builds
