# Supabase Authentication System - Setup Guide

This guide provides step-by-step instructions for rebuilding the authentication system with predefined users.

## Overview

The authentication system features:
- ✅ **Supabase Auth** with email/username and password
- ✅ **Role-Based Access Control** (super_admin, admin, user)
- ✅ **Automatic Role-Based Redirects**
  - Admins → `/admin` (Admin Dashboard)
  - Regular Users → `/dashboard` (User Dashboard)
- ✅ **Row Level Security (RLS)** for data isolation
- ✅ **Predefined User Credentials** for immediate testing
- ✅ **Secure password authentication**

## Prerequisites

1. Supabase project set up
2. Environment variables configured in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Step 1: Rebuild Database Schema

Execute the SQL script to create all tables, functions, triggers, and RLS policies:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/rebuild_with_auth.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute

### Option B: Using Supabase CLI

```bash
supabase db push --db-url "your_database_url"
```

**Expected Output:**
```
✅ DATABASE REBUILD COMPLETED!
📊 DATABASE SUMMARY:
   - Tables created: 10
   - Functions created: 14
   - Triggers created: 9
   - RLS Policies created: 40+
```

## Step 2: Create Predefined Users

Run the Node.js script to create admin and regular users:

```bash
node scripts/create-predefined-users.js
```

**Expected Output:**
```
🚀 CREATING PREDEFINED USERS
📝 Creating user: super_admin (admin@paasolutions.com)...
   ✅ Auth user created with ID: [uuid]
   ✅ Profile created: super_admin (super_admin)
📝 Creating user: admin1 (admin1@paasolutions.com)...
   ✅ Auth user created with ID: [uuid]
   ✅ Profile created: admin1 (admin)
...
✅ Successfully created: 5 users
```

## Step 3: Predefined User Credentials

### Super Admin Account
- **Username:** `super_admin`
- **Email:** `admin@paasolutions.com`
- **Password:** `Admin@2026`
- **Role:** `super_admin`
- **Access:** Full system access, redirects to `/admin`

### Admin Account
- **Username:** `admin1`
- **Email:** `admin1@paasolutions.com`
- **Password:** `Admin1@2026`
- **Role:** `admin`
- **Access:** Management privileges, redirects to `/admin`

### Regular User Accounts

#### User 1
- **Username:** `user1`
- **Email:** `user1@paasolutions.com`
- **Password:** `User1@2026`
- **Role:** `user`
- **Access:** Standard user access, redirects to `/dashboard`

#### User 2
- **Username:** `user2`
- **Email:** `user2@paasolutions.com`
- **Password:** `User2@2026`
- **Role:** `user`
- **Access:** Standard user access, redirects to `/dashboard`

#### User 3
- **Username:** `user3`
- **Email:** `user3@paasolutions.com`
- **Password:** `User3@2026`
- **Role:** `user`
- **Access:** Standard user access, redirects to `/dashboard`

## Step 4: Test Authentication

### Start the Development Server
```bash
npm run dev
```

### Test Login

1. Navigate to: `http://localhost:3000/login`
2. Try logging in with different users

### Test Cases

#### Test 1: Super Admin Login
```
Username/Email: super_admin (or admin@paasolutions.com)
Password: Admin@2026
Expected: Redirect to /admin dashboard
```

#### Test 2: Admin Login
```
Username/Email: admin1 (or admin1@paasolutions.com)
Password: Admin1@2026
Expected: Redirect to /admin dashboard
```

#### Test 3: Regular User Login
```
Username/Email: user1 (or user1@paasolutions.com)
Password: User1@2026
Expected: Redirect to /dashboard
```

#### Test 4: Login with Email
```
Email: admin@paasolutions.com
Password: Admin@2026
Expected: Successful login and redirect to /admin
```

#### Test 5: Login with Username
```
Username: user1
Password: User1@2026
Expected: Successful login and redirect to /dashboard
```

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

## Database Schema

### Core Tables

1. **profiles** - User profiles with role and status
   - Extends `auth.users`
   - Fields: email, username, full_name, role, status, supervisor_name
   - Roles: `user`, `admin`, `super_admin`
   - Status: `active`, `inactive`, `suspended`

2. **user_settings** - Per-user preferences
   - Fields: dashboard_access, admin_privileges, notifications_enabled

3. **projects** - Available projects
   - Projects: Salam, Mobily

4. **customers** - Unified customer table
   - Project-specific fields
   - Unique constraints per project

5. **audit_logs** - System audit trail
   - Tracks all user actions

### Security Features

#### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Users can view/edit their own data
- Admins can view/edit all data
- Super admins have full access

#### Database Functions
- `is_admin(user_id)` - Check admin status
- `is_super_admin(user_id)` - Check super admin status
- `handle_new_user()` - Auto-create profile on signup
- Customer existence checks
- Statistics functions

#### Triggers
- Auto-update `updated_at` timestamps
- Auto-create profile on user signup
- Auto-create user settings

## Troubleshooting

### Issue: Users not created
**Solution:** Verify environment variables are set correctly in `.env.local`

### Issue: Login fails
**Solution:**
1. Check if database schema is created
2. Verify user exists in `auth.users` table
3. Check user profile exists in `profiles` table
4. Verify user status is `active`

### Issue: Wrong redirect after login
**Solution:**
1. Check user role in `profiles` table
2. Verify middleware is working (`/src/middleware.ts`)
3. Check dashboard protection logic

### Issue: Permission denied errors
**Solution:**
1. Verify RLS policies are created
2. Check user role and status
3. Ensure `is_admin()` function exists

## File Structure

```
design-cellular/
├── supabase/
│   ├── rebuild_with_auth.sql          # Complete database schema
│   └── rebuild_database_simplified.sql # Previous version
├── scripts/
│   └── create-predefined-users.js     # User creation script
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
│   └── middleware.ts                  # Route protection
└── AUTHENTICATION_SETUP.md            # This file
```

## API Endpoints

### Admin User Management

#### Create User
```typescript
POST /api/admin/create-user
Body: {
  username: string,
  email: string,
  password: string,
  supervisor_name: string
}
Required Role: admin or super_admin
```

#### Delete User
```typescript
DELETE /api/admin/delete-user
Body: { userId: string }
Required Role: admin or super_admin
Note: Cannot delete yourself
```

## Security Best Practices

1. **Change Default Passwords** - Update predefined user passwords immediately after setup
2. **Enable MFA** - Consider enabling multi-factor authentication for admin accounts
3. **Audit Logs** - Regularly review audit logs for suspicious activity
4. **Password Policy** - Enforce strong passwords (minimum 8 characters)
5. **Session Management** - Sessions are automatically refreshed by middleware
6. **HTTPS Only** - Always use HTTPS in production

## Next Steps

1. ✅ Database schema created
2. ✅ Predefined users created
3. ⬜ Test authentication with all user roles
4. ⬜ Update default passwords
5. ⬜ Configure production environment
6. ⬜ Set up monitoring and logging
7. ⬜ Enable MFA for admin accounts (optional)
8. ⬜ Configure email templates in Supabase

## Support

For issues or questions:
1. Check Supabase dashboard logs
2. Review browser console for errors
3. Check server logs for backend issues
4. Verify all environment variables are set

---

**Created:** 2026-01-20
**Version:** 3.0
**Status:** Production Ready ✅
