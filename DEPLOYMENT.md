# Production Deployment Instructions - EC2

## ✅ Repository Status
- **Repository**: https://github.com/KamleshSingh7461/eusai_crm.git
- **Latest Commit**: 621d299
- **Branch**: main
- **Status**: Ready for deployment

## 📦 What's Included in This Deployment
- ✅ Calendar API OAuth fixes
- ✅ Updated seed file with 3 production users
- ✅ New API endpoints (calendar, ping, milestone details)
- ✅ Improved error handling across all routes
- ✅ Force-dynamic calendar route (no caching issues)

## 🚀 Deployment Steps on EC2

### 1. Pull Latest Code
```bash
cd /path/to/eusai_crm
git pull origin main
```

### 2. Install Dependencies (if needed)
```bash
npm install
```

### 3. Update Production Environment Variables
Ensure your `.env` file on EC2 has:
```bash
# Production Database (AWS RDS)
DATABASE_URL="postgresql://postgres:EusaiAdmin2026!@eusai-crm-db-v2.c1sw6ykwulyt.ap-south-1.rds.amazonaws.com:5432/postgres?schema=public"

# NextAuth
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="your-secure-secret-here"

# Google OAuth (CRITICAL: Use only ONE active secret)
GOOGLE_CLIENT_ID="257076820133-mrv6tc9ckc9rd78848jdaipokm2jemga.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-active-secret-here"

# Gemini API
GEMINI_API_KEY="AIzaSyCXvkTmH0xW4MJywL5gAKKS2Rd85SPja3g"
```

### 4. Run Database Migrations
```bash
npx prisma migrate deploy
```

### 5. Seed Production Users
```bash
npm run prisma:seed
```

This will create/update:
- ✅ `admin@eusaiteam.com` (DIRECTOR)
- ✅ `pranav@eusaiteam.com` (DIRECTOR)
- ✅ `infotech@eusaiteam.com` (EMPLOYEE)

### 6. Build Production
```bash
npm run build
```

### 7. Restart Application
```bash
pm2 restart eusai-crm
# OR
pm2 restart all
```

## 🔐 Post-Deployment: User Login

### For Admin/Pranav (Directors)
1. Navigate to `https://your-domain.com/login`
2. Click "Sign in with Google"
3. Use Google account linked to the email
4. Calendar features will work after Google OAuth

### For InfoTech (Employee)
1. Use credentials login at `https://your-domain.com/login`
2. Email: `infotech@eusaiteam.com`
3. Password: As configured in `lib/auth.ts` (currently: `admin123` for demo)

## ⚠️ Important Notes

### Google OAuth Configuration
- **CRITICAL**: Ensure only ONE client secret is active on Google Cloud Console
- Disable the old secret (`****tK6M` from Feb 15)
- Keep the newer secret active
- Update GOOGLE_CLIENT_SECRET in production .env

### Database
- The seed will UPSERT users (create if not exists, update if exists)
- Existing data will be preserved
- No data loss will occur

### Calendar Features
- Users need to sign in with Google for calendar to work
- After first Google login, refresh tokens will be stored
- Calendar View will display real Google Calendar events

## ✅ Verification Checklist

After deployment, verify:
- [ ] Application starts without errors (`pm2 logs`)
- [ ] Database connection successful
- [ ] All 3 users can login successfully
- [ ] Google OAuth flow works
- [ ] Calendar displays events (for Google-authenticated users)
- [ ] All API routes return 200 OK

## 🆘 Troubleshooting

### Login Issues
- Check production .env has correct DATABASE_URL
- Verify users exist: `npx prisma studio` (on EC2)
- Check pm2 logs for auth errors

### Calendar Not Working
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET match Google Cloud Console
- Ensure only ONE secret is active on Google Cloud
- User must sign in with Google (not credentials)
- Check browser console for error details

### Database Issues
- Run: `npx prisma migrate status`
- If needed: `npx prisma migrate deploy`
- Check RDS security groups allow EC2 IP
