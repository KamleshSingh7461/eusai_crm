# Developer Guide

This guide explains how to set up the EuSai CRM project on a new workstation (Mac or Windows).

## Prerequisites
- **Node.js**: v20 or higher (Check with `node -v`)
- **Git**: Installed and configured
- **Database**: Access to the shared AWS RDS instance (or a local PostgreSQL instance)

## 1. Clone & Install
```bash
git clone <repository-url>
cd eusai_crm
npm install
```

## 2. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Fill in the values in `.env`.
> **Note:** Ask the project lead for the `DATABASE_URL` and `NEXTAUTH_SECRET` if you don't have them.

## 3. Database Sync
Since we use a shared development database (AWS RDS), you **do NOT** need to run migrations to create tables. The schema is already there.

However, you **MUST** generate the Prisma client for your OS:
```bash
# This downloads the correct binary for your OS (Windows/Mac/Linux)
npx prisma generate
```

### Making Schema Changes
If you modify `prisma/schema.prisma`:
1.  Run `npx prisma migrate dev --name <descriptive-name>`
2.  This will apply changes to the shared DB and generate a new migration file.
3.  Commit the new migration file to Git so others get it.

## 4. Running the App
```bash
npm run dev
# App will start at http://localhost:3000
```

## Troubleshooting

### "Query Engine ... not found"
This usually happens if you switch OS or pull changes without regenerating.
**Fix:** Run `npx prisma generate`

### "Server Error" on Login
Check your `.env` file.
- Ensure `NEXTAUTH_URL` matches your actual port (usually `http://localhost:3000`).
- Ensure `NEXTAUTH_SECRET` is set.
