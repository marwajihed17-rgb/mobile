# Quick Start Guide - Supabase Authentication Setup

## 🚀 Get Started in 3 Steps

### Step 1: Run Database Schema (5 minutes)

1. Open Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy entire contents of `supabase/rebuild_with_auth.sql`
6. Paste and click **Run**

✅ You should see: "DATABASE REBUILD COMPLETED!"

---

### Step 2: Create Your First Admin User (2 minutes)

1. In Supabase Dashboard, click **Authentication** → **Users**
2. Click **Add user** (green button)
3. Fill in:
   - **Email:** `admin@paasolutions.com`
   - **Password:** `Admin@2026` (or your secure password)
   - ✅ **Check:** "Auto Confirm User"

4. Click **Show advanced settings**
5. In **User Metadata** field, paste:
```json
{
  "username": "admin",
  "full_name": "Administrator",
  "supervisor_name": "System",
  "role": "super_admin"
}
```

6. Click **Create user**

---

### Step 3: Test Login (1 minute)

1. Start your dev server:
```bash
npm run dev
```

2. Go to: http://localhost:3000/login

3. Log in with:
   - **Username or Email:** `admin` or `admin@paasolutions.com`
   - **Password:** `Admin@2026` (or your password)

4. You should be redirected to: `/admin` (Admin Dashboard)

---

## 🎉 That's It!

You now have a working authentication system with:
- ✅ Login with email or username
- ✅ Role-based access control
- ✅ Automatic redirects (admin → /admin, user → /dashboard)
- ✅ Secure authentication with Supabase

---

## 📖 Detailed Documentation

For more details, see:
- **Manual Setup Guide:** `AUTHENTICATION_MANUAL_SETUP.md`
- **Complete Setup Guide:** `AUTHENTICATION_SETUP.md`

---

## 🔐 Creating More Users

### Create Regular Users:

1. **Authentication** → **Users** → **Add user**
2. Fill in email and password
3. ✅ Check "Auto Confirm User"
4. User Metadata:
```json
{
  "username": "user1",
  "full_name": "User Name",
  "supervisor_name": "Admin",
  "role": "user"
}
```

### User Metadata Template:

**For Admins:**
```json
{
  "username": "unique_username",
  "full_name": "Full Name",
  "supervisor_name": "Supervisor",
  "role": "admin"
}
```

**For Regular Users:**
```json
{
  "username": "unique_username",
  "full_name": "Full Name",
  "supervisor_name": "Supervisor",
  "role": "user"
}
```

---

## ⚡ Important Notes

1. **Always check "Auto Confirm User"** when creating users manually
2. **Username must be unique** across all users
3. **Valid roles:** `user`, `admin`, `super_admin`
4. **Login works with email OR username**
5. **Admins redirect to** `/admin`, **users redirect to** `/dashboard`

---

## 🆘 Troubleshooting

**Problem: Can't log in**
- Check user exists in Authentication → Users
- Verify "Email Confirmed" is ✅
- Check password is correct

**Problem: Wrong redirect**
- Check user role in Table Editor → profiles table
- Should be: `user`, `admin`, or `super_admin`

**Problem: Profile not created**
- Check Table Editor → profiles table
- If missing, re-run `rebuild_with_auth.sql`

---

## 📊 Verify Setup

Check these in Supabase Dashboard:

1. **SQL Editor** → Run:
```sql
SELECT * FROM profiles;
```
Should show your user with username, role, and status.

2. **Table Editor** → **profiles** table
Should show all users with their roles.

3. **Authentication** → **Users**
Should show all created users with ✅ confirmed emails.

---

## 🎯 Next Steps

- [ ] Create more users via Dashboard
- [ ] Test login with different roles
- [ ] Explore admin dashboard features
- [ ] Customize user profiles
- [ ] Change default passwords

---

**Happy coding! 🚀**
