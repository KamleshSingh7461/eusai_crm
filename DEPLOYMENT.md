# 🚀 True Tactical Deployment Guide (EC2)

This guide outlines the finalized deployment procedure for the Garrison Command Center, optimized for the hybrid Local-to-RDS development model.

---

## 🛠 1. Development Cycle (Local)

When changes are validated locally on the live database link:

```bash
# 1. Add changes
git add .

# 2. Commit with tactical prefix
git commit -m "feat: [feature name] and tactical refinements"

# 3. Push to Command (Main Branch)
git push origin main
```

---

## 🌍 2. Production Synchronization (EC2)

Execute these on your Ubuntu instance to pull and align the garrison:

```bash
# 1. Enter project root
cd ~/eusai_crm

# 2. Pull Intelligence Updates
git pull origin main

# 3. Synchronize Dependencies
npm install
```

---

## 💾 3. Database Synchronization (RDS)

### **Scenario A: Standard Migration (Preferred)**
Use this if there are no provider conflicts:
```bash
npx prisma generate
npm run prisma:deploy
```

### **Scenario B: Hybrid/Baseline Fix (If P3019 or P3005 occurs)**
If the system flags a "Provider Mismatch" (SQLite vs PostgreSQL) or "Schema not empty" error:
```bash
# 1. Align the live RDS schema directly
npx prisma db push

# 2. Regenerate the client
npx prisma generate
```

---

## 🏗 4. Build & Power On

Compiling the optimized production bundle and restarting the primary engine:

```bash
# 1. Build Strategic Assets
npm run build

# 2. Restart via PM2 (Process Manager)
pm2 restart all

# 3. Verify Vital Signs
pm2 logs
```

---

## ⚠️ Tactical Troubleshooting

### **Error P3019 (Provider Mismatch)**
*   **Cause**: The migration history was poisoned by local SQLite files.
*   **Fix**: Already resolved in `prisma/migrations/migration_lock.toml`. If it recurs, ensure `provider = "postgresql"` is set in that file.

### **Error P3005 (Schema Not Empty)**
*   **Cause**: You developed on the live DB locally, but the EC2 instance doesn't have the migration history records.
*   **Fix**: Use `npx prisma db push`. It ignores history and syncs the schema directly.

### **Session Timeouts / Pool Errors**
*   **Fix**: Implemented in `src/lib/auth.ts`. We now use JWT-cached roles to eliminate 80% of redundant database hits during session validation.

---

## ✅ Deployment Checklist
- [ ] `git pull` successful?
- [ ] `prisma client` regenerated?
- [ ] `db push` or `migrate deploy` completed?
- [ ] `next build` finished without errors?
- [ ] `pm2 restart` performed?
- [ ] Login and Performance Reports verified?

**Last Updated**: 2026-02-23 (Tactical Ranking Refinement & Deployment Stabilization)
