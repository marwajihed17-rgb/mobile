# Supabase Authentication System - Manual User Setup Guide

This guide provides step-by-step instructions for setting up authentication with **manually created users** via the Supabase Dashboard.

## Overview

The authentication system features:
- ✅ **Supabase Auth** with email/username and password
- ✅ **Role-Based Access Control** (super_admin, admin, user)
- ✅ **Automatic Role-Based Redirects**
  - Admins → `/admin` (Admin Dashboard)
  - Regular Users → `/dashboard` (User Dashboard)
- ✅ **Row Level Security (RLS)** for data isolation
- ✅ **Manual user creation** via Supabase Dashboard

## Prerequisites

1. Supabase project set up
2. Environment variables configured in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

---

## Step 1: Rebuild Database Schema

Execute the SQL script to create all tables, functions, triggers, and RLS policies.

### Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: `https://app.supabase.com`
2. Select your project
3. Navigate to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy the entire contents of `supabase/rebuild_with_auth.sql`
6. Paste into the SQL Editor
7. Click **Run** or press `Ctrl+Enter` to execute

**Expected Output:**
```
✅ DATABASE REBUILD COMPLETED!
📊 DATABASE SUMMARY:
   - Tables created: 10
   - Functions created: 14
   - Triggers created: 9
   - RLS Policies created: 40+
```

---

## Step 2: Create Users Manually via Supabase Dashboard

### A. Navigate to Authentication

1. In your Supabase Dashboard, click **Authentication** in the left sidebar
2. Click **Users** tab
3. Click the **Add user** button (green button in top right)

### B. Create Super Admin User

Fill in the user creation form:

**User Details:**
- **Email:** `admin@paasolutions.com` (or your preferred admin email)
- **Password:** Create a strong password (e.g., `Admin@2026`)
- **Auto Confirm User:** ✅ **Check this box** (important!)

**User Metadata (Raw JSON):**
Click **Show advanced settings** and add this JSON in the "User Metadata" field:

```json
{
  "username": "super_admin",
  "full_name": "Super Administrator",
  "supervisor_name": "System",
  "role": "super_admin"
}
```

Click **Create user**

### C. Create Admin User

Repeat the process with these details:

**User Details:**
- **Email:** `admin1@paasolutions.com` (or your preferred admin email)
- **Password:** Create a strong password
- **Auto Confirm User:** ✅ **Check this box**

**User Metadata (Raw JSON):**
```json
{
  "username": "admin1",
  "full_name": "Admin User",
  "supervisor_name": "Super Admin",
  "role": "admin"
}
```

### D. Create Regular Users

For each regular user, use these details:

**User 1:**
- **Email:** `user1@paasolutions.com`
- **Password:** Create a strong password
- **Auto Confirm User:** ✅ **Check this box**

**User Metadata (Raw JSON):**
```json
{
  "username": "user1",
  "full_name": "Regular User 1",
  "supervisor_name": "Admin 1",
  "role": "user"
}
```

**User 2:**
- **Email:** `user2@paasolutions.com`
- **Password:** Create a strong password
- **Auto Confirm User:** ✅ **Check this box**

**User Metadata (Raw JSON):**
```json
{
  "username": "user2",
  "full_name": "Regular User 2",
  "supervisor_name": "Admin 1",
  "role": "user"
}
```

**User 3:**
- **Email:** `user3@paasolutions.com`
- **Password:** Create a strong password
- **Auto Confirm User:** ✅ **Check this box**

**User Metadata (Raw JSON):**
```json
{
  "username": "user3",
  "full_name": "Regular User 3",
  "supervisor_name": "Admin 1",
  "role": "user"
}
```

---

## Step 3: Verify User Profiles Were Created

The database trigger `handle_new_user()` automatically creates profiles when users are added.

### Verify in Supabase Dashboard:

1. Go to **Table Editor** in the left sidebar
2. Select the **profiles** table
3. You should see all your users with:
   - ✅ Email
   - ✅ Username
   - ✅ Full name
   - ✅ Role (user, admin, or super_admin)
   - ✅ Status (active)

### Verify User Settings:

1. In **Table Editor**, select the **user_settings** table
2. You should see one row per user with default settings

---

## Step 4: Important User Metadata Fields

When creating users manually, **you must include these fields** in User Metadata:

### Required Fields:
```json
{
  "username": "unique_username",     // REQUIRED - Used for login
  "full_name": "User Full Name",     // REQUIRED - Display name
  "supervisor_name": "Supervisor",   // REQUIRED - User's supervisor
  "role": "user"                     // REQUIRED - user, admin, or super_admin
}
```

### Valid Role Values:
- `"user"` - Regular user (redirects to `/dashboard`)
- `"admin"` - Admin user (redirects to `/admin`)
- `"super_admin"` - Super admin (redirects to `/admin`)

⚠️ **Important:** If you don't include the `role` field, it will default to `"user"`

---

## Step 5: Test Authentication

### Start the Development Server
```bash
npm run dev
```

### Test Login

1. Navigate to: `http://localhost:3000/login`
2. You can log in with **either email OR username**

### Test Cases

#### Test 1: Admin Login with Email
```
Email: admin@paasolutions.com
Password: [your admin password]
Expected: Redirect to /admin dashboard
```

#### Test 2: Admin Login with Username
```
Username: super_admin
Password: [your admin password]
Expected: Redirect to /admin dashboard
```

#### Test 3: Regular User Login
```
Username: user1
Password: [your user1 password]
Expected: Redirect to /dashboard
```

---

## Authentication Flow

```
┌─────────────────────────────────────────┐
│  User enters email/username + password  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│      Login Page (/login)                │
│  - Accepts email OR username            │
│  - Validates credentials                │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  signInWithEmailOrUsername()            │
│  - Checks if input is email/username    │
│  - Fetches email from username if needed│
│  - Calls Supabase Auth                  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│      Supabase Auth Service              │
│  - Validates credentials                │
│  - Creates session                      │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│    handle_new_user() Trigger            │
│  - Auto-creates profile in profiles     │
│  - Auto-creates user_settings           │
│  - Uses metadata for role & username    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│      Middleware (/src/middleware.ts)    │
│  - Validates session                    │
│  - Checks user status (active)          │
│  - Fetches user profile with role       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         Role-Based Redirect             │
│  ┌─────────────────────────────────┐   │
│  │ If role = admin or super_admin  │   │
│  │    → Redirect to /admin         │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ If role = user                  │   │
│  │    → Redirect to /dashboard     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Step 6: Create Additional Users via Admin Dashboard (After Setup)

Once you have at least one admin user, you can create new users through the app:

1. Log in as an admin user
2. Go to `/admin` dashboard
3. Navigate to the **Users** or **Settings** section
4. Click **Add New User**
5. Fill in the form:
   - Username
   - Email
   - Password
   - Supervisor Name

The app will use the `/api/admin/create-user` endpoint to create the user.

---

## Database Schema Summary

### Core Tables Created:

1. **profiles** - User profiles with role and status
   - Fields: email, username, full_name, role, status, supervisor_name
   - Roles: `user`, `admin`, `super_admin`
   - Status: `active`, `inactive`, `suspended`

2. **user_settings** - Per-user preferences
   - Auto-created when user is created
   - Fields: dashboard_access, admin_privileges, notifications_enabled

3. **projects** - Available projects (Salam, Mobily)
   - Auto-seeded with default projects

4. **customers** - Unified customer table
   - Project-specific fields
   - RLS policies per user

5. **audit_logs** - System audit trail

### Security Features:

✅ **Row Level Security (RLS)** - All tables have RLS enabled
✅ **Role-Based Policies** - Users see only their data, admins see all
✅ **Automated Profile Creation** - Trigger creates profile on user signup
✅ **Function-Based Access Control** - `is_admin()`, `is_super_admin()` functions

---

## Troubleshooting

### Issue: Profile not created after adding user

**Solution:**
1. Check if the `handle_new_user()` trigger exists:
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created';
   ```
2. If missing, re-run the `rebuild_with_auth.sql` script

### Issue: Can't log in with username

**Solution:**
1. Verify username exists in profiles table
2. Check that `username` was set in User Metadata when creating the user
3. Ensure username is unique

### Issue: Wrong redirect after login

**Solution:**
1. Check user role in `profiles` table
2. Verify `role` was set in User Metadata
3. Valid values: `user`, `admin`, `super_admin`

### Issue: "Permission denied" errors

**Solution:**
1. Check user status is `active` in profiles table
2. Verify RLS policies are created
3. Ensure user role is correct

### Issue: User can't see their data

**Solution:**
1. Verify user_id matches auth.users.id
2. Check RLS policies on the table
3. Ensure user status is `active`

---

## Manual Database Verification

### Check if user profile exists:
```sql
SELECT * FROM profiles WHERE email = 'admin@paasolutions.com';
```

### Check user settings:
```sql
SELECT * FROM user_settings
JOIN profiles ON user_settings.user_id = profiles.id
WHERE profiles.email = 'admin@paasolutions.com';
```

### Check user role:
```sql
SELECT id, email, username, role, status
FROM profiles
ORDER BY created_at DESC;
```

### Manually update user role (if needed):
```sql
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'admin@paasolutions.com';
```

---

## User Creation Template

When creating users manually, use this template:

### Template for Admin Users:
```json
{
  "username": "[unique_username]",
  "full_name": "[Full Name]",
  "supervisor_name": "[Supervisor Name]",
  "role": "admin"
}
```

### Template for Regular Users:
```json
{
  "username": "[unique_username]",
  "full_name": "[Full Name]",
  "supervisor_name": "[Supervisor Name]",
  "role": "user"
}
```

---

## Security Best Practices

1. ✅ **Strong Passwords** - Use complex passwords (min 8 characters)
2. ✅ **Auto-Confirm Users** - Always check "Auto Confirm User" for manual creation
3. ✅ **Unique Usernames** - Ensure each username is unique
4. ✅ **Valid Emails** - Use real, valid email addresses
5. ✅ **Set Correct Roles** - Double-check role assignment
6. ✅ **HTTPS Only** - Use HTTPS in production
7. ✅ **Regular Audits** - Review audit logs periodically

---

## Quick Reference

### Supabase Dashboard Navigation:
- **Create Users:** Authentication → Users → Add user
- **View Profiles:** Table Editor → profiles
- **Run SQL:** SQL Editor → New query
- **Check Policies:** Database → Policies

### Login URLs:
- **Development:** `http://localhost:3000/login`
- **Production:** `https://your-domain.com/login`

### Dashboard URLs:
- **Admin Dashboard:** `/admin`
- **User Dashboard:** `/dashboard`

---

## Files Reference

```
design-cellular/
├── supabase/
│   └── rebuild_with_auth.sql          # Database schema (execute this first)
├── src/
│   ├── lib/
│   │   ├── auth.ts                    # Auth functions
│   │   └── supabase/
│   │       ├── client.ts              # Browser client
│   │       ├── server.ts              # Server client
│   │       └── middleware.ts          # Session management
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx         # Login page
│   │   └── (protected)/
│   │       ├── dashboard/             # User dashboard
│   │       └── admin/                 # Admin dashboard
│   ├── middleware.ts                  # Route protection
│   └── app/api/admin/create-user/     # User creation API
└── AUTHENTICATION_MANUAL_SETUP.md     # This file
```

---

## Summary Checklist

- [ ] Run `rebuild_with_auth.sql` in Supabase SQL Editor
- [ ] Verify tables created (profiles, user_settings, projects, etc.)
- [ ] Create super admin user via Supabase Dashboard
- [ ] Add user metadata with username and role
- [ ] Verify profile created in profiles table
- [ ] Create additional admin/regular users
- [ ] Test login with email
- [ ] Test login with username
- [ ] Verify role-based redirects work
- [ ] Test admin dashboard access control

---

**Created:** 2026-01-20
**Version:** 3.0 (Manual Setup)
**Status:** Production Ready ✅
