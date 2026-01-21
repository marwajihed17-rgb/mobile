# Supabase Authentication Setup Guide

Complete guide for setting up email/password authentication with manual user creation via Supabase Dashboard that redirects to the admin dashboard.

## 🎯 Overview

This application uses Supabase for authentication with the following features:
- **Email/Password Authentication**: Users login with email or username and password
- **Role-Based Access Control**: Users can have roles: `user`, `admin`, or `super_admin`
- **Automatic Redirects**:
  - Admin users → `/admin` dashboard
  - Regular users → `/dashboard`
- **Status Management**: Users can be `active`, `inactive`, or `suspended`

---

## 📋 Prerequisites

Before you begin, ensure you have:
1. Access to your Supabase project dashboard
2. Your Supabase project URL and keys configured in `.env.local`
3. Database initialized with the schema (run `supabase/init_database.sql` if not done)

---

## 🚀 Step-by-Step: Creating an Admin User

### Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: **mlifjngvevazuxgwzinf** (based on your .env.local)

### Step 2: Create User via Authentication Panel

1. **Navigate to Authentication**:
   - Click on **"Authentication"** in the left sidebar
   - Click on **"Users"** tab

2. **Add New User**:
   - Click the **"Add User"** button (top right)
   - Select **"Create new user"**

3. **Fill in User Details**:
   ```
   Email: admin@example.com
   Password: [Create a strong password - minimum 8 characters]
   ```

4. **Optional: Auto Confirm User**:
   - Check **"Auto Confirm User"** if you want the user to be immediately active
   - Leave unchecked if you want them to verify their email first

5. **Click "Create User"**

6. **Copy the User ID**:
   - After creation, you'll see the new user in the list
   - Click on the user to view details
   - **Copy the UUID** (e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
   - You'll need this for the next step

### Step 3: Promote User to Admin Role

1. **Navigate to SQL Editor**:
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New query"**

2. **Run Admin Promotion Query**:

   Choose one of the following options:

   **Option A: Update by Email (Easiest)**
   ```sql
   UPDATE public.profiles
   SET role = 'admin', status = 'active'
   WHERE email = 'admin@example.com';
   ```

   **Option B: Update by User ID (Most Reliable)**
   ```sql
   UPDATE public.profiles
   SET role = 'admin', status = 'active'
   WHERE id = 'PASTE_USER_ID_HERE';
   ```

   **Option C: Create Super Admin**
   ```sql
   UPDATE public.profiles
   SET role = 'super_admin', status = 'active'
   WHERE email = 'admin@example.com';
   ```

3. **Click "Run"** to execute the query

4. **Verify Success**:
   ```sql
   SELECT id, email, username, role, status
   FROM public.profiles
   WHERE email = 'admin@example.com';
   ```

   You should see:
   - `role`: `admin` or `super_admin`
   - `status`: `active`

---

## 🔍 Verification: Test the Login Flow

### Test Admin Login

1. **Open your application**: `http://localhost:3000` (or your deployed URL)

2. **Navigate to Login**: Click on login or go to `/login`

3. **Enter Credentials**:
   - Email/Username: `admin@example.com`
   - Password: [The password you created]

4. **Click "تسجيل الدخول"** (Login)

5. **Expected Result**:
   - ✅ You should be redirected to `/admin` dashboard
   - ✅ You should see admin features: User Management, Salam Customers, Mobily Customers
   - ✅ No errors or access denied messages

### Troubleshooting

**Problem**: User can't login / "حسابك معطل" error
- **Solution**: Check user status is `active`:
  ```sql
  SELECT email, status FROM public.profiles WHERE email = 'admin@example.com';
  -- If status is 'inactive' or 'suspended':
  UPDATE public.profiles SET status = 'active' WHERE email = 'admin@example.com';
  ```

**Problem**: User redirects to `/dashboard` instead of `/admin`
- **Solution**: Check user role is `admin` or `super_admin`:
  ```sql
  SELECT email, role FROM public.profiles WHERE email = 'admin@example.com';
  -- If role is 'user':
  UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
  ```

**Problem**: "Failed to get user profile" error
- **Solution**: User exists in `auth.users` but not in `profiles` table. Run:
  ```sql
  -- Check if profile exists
  SELECT au.id, au.email, p.id as profile_id
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE au.email = 'admin@example.com';

  -- If profile_id is NULL, create profile manually using the create_admin_user.sql script
  ```

**Problem**: Database trigger not creating profile automatically
- **Solution**: Use the manual profile creation script in `supabase/create_admin_user.sql` (OPTION 2)

---

## 🔐 Authentication Flow Explained

### How Login Works

```mermaid
graph TD
    A[User enters email/username + password] --> B[Login page validates credentials]
    B --> C{Credentials valid?}
    C -->|No| D[Show error message]
    C -->|Yes| E[Fetch user profile from database]
    E --> F{Profile status = 'active'?}
    F -->|No| G[Sign out & show "حسابك معطل"]
    F -->|Yes| H{Check user role}
    H -->|admin/super_admin| I[Redirect to /admin]
    H -->|user| J[Redirect to /dashboard]
```

### Key Components

1. **Login Page** (`src/app/(auth)/login/page.tsx`):
   - Lines 68-73: Role-based redirect logic
   - Checks profile role after successful authentication
   - Redirects admin/super_admin to `/admin`
   - Redirects regular users to `/dashboard`

2. **Middleware** (`src/lib/supabase/middleware.ts`):
   - Protects routes from unauthenticated access
   - Checks user status (active/inactive/suspended)
   - Signs out inactive users automatically

3. **Database Trigger** (`supabase/init_database.sql`):
   - Lines 201-242: `handle_new_user()` function
   - Automatically creates profile when user signs up
   - Sets default role to `user`
   - Creates user_settings and module_access entries

---

## 👥 User Roles & Permissions

### Role Hierarchy

| Role | Access Level | Capabilities |
|------|--------------|--------------|
| **user** | Standard access | - View own customers<br>- Add/edit own records<br>- Access own dashboard |
| **admin** | Administrative access | - All user capabilities<br>- View ALL customers (Salam & Mobily)<br>- Manage users (create/delete)<br>- View statistics<br>- Access admin dashboard |
| **super_admin** | Full control | - All admin capabilities<br>- Future: system configuration<br>- Future: audit logs access |

### User Status

| Status | Description | Login Allowed? |
|--------|-------------|----------------|
| **active** | User account is enabled and functional | ✅ Yes |
| **inactive** | User account is temporarily disabled | ❌ No - redirected to login |
| **suspended** | User account is suspended (requires admin action) | ❌ No - redirected to login |

---

## 📊 Database Schema Reference

### Profiles Table

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,                    -- References auth.users(id)
    email TEXT NOT NULL,                    -- User email
    full_name TEXT,                         -- Full name (optional)
    username TEXT NOT NULL UNIQUE,          -- Unique username for login
    supervisor_name TEXT,                   -- Supervisor name (optional)
    avatar_url TEXT,                        -- Profile picture URL
    role user_role DEFAULT 'user',          -- 'user' | 'admin' | 'super_admin'
    status user_status DEFAULT 'active',    -- 'active' | 'inactive' | 'suspended'
    created_by_id UUID,                     -- Who created this user
    created_by_username TEXT,               -- Creator's username
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🛠️ Advanced: Bulk User Creation

### Create Multiple Admin Users at Once

```sql
-- Method 1: Promote existing users
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email IN (
    'admin1@example.com',
    'admin2@example.com',
    'admin3@example.com'
);

-- Method 2: Create admin users from scratch (after creating in Auth panel)
-- See supabase/create_admin_user.sql for detailed script
```

### Create Admin via Application UI

1. Login as an existing admin
2. Go to `/admin` dashboard
3. Click on **"إدارة المستخدمين"** (User Management) tab
4. Fill in the "إضافة مستخدم جديد" (Add New User) form:
   - Username
   - Email
   - Supervisor Name
   - Password (minimum 8 characters)
5. Click **"إضافة مستخدم"** (Add User)
6. The new user will be created with `user` role
7. To promote to admin, run SQL query:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'newuser@example.com';
   ```

---

## 📝 Quick Reference: SQL Queries

### Check All Admin Users
```sql
SELECT id, email, username, role, status, created_at
FROM public.profiles
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;
```

### Count Users by Role
```sql
SELECT role, COUNT(*) as user_count
FROM public.profiles
GROUP BY role
ORDER BY user_count DESC;
```

### List All Active Users
```sql
SELECT email, username, role, status
FROM public.profiles
WHERE status = 'active'
ORDER BY created_at DESC;
```

### Deactivate a User
```sql
UPDATE public.profiles
SET status = 'inactive'
WHERE email = 'user@example.com';
```

### Reactivate a User
```sql
UPDATE public.profiles
SET status = 'active'
WHERE email = 'user@example.com';
```

### Delete a User Completely
```sql
-- This will cascade delete from profiles and auth.users
DELETE FROM auth.users
WHERE email = 'user@example.com';
```

---

## 🔗 Related Files

- **SQL Scripts**:
  - `supabase/init_database.sql` - Complete database schema
  - `supabase/create_admin_user.sql` - Admin user creation helper

- **Authentication Code**:
  - `src/app/(auth)/login/page.tsx` - Login page with role-based redirect
  - `src/lib/auth.ts` - Authentication helper functions
  - `src/lib/supabase/middleware.ts` - Route protection middleware

- **Admin Dashboard**:
  - `src/app/(protected)/admin/page.tsx` - Admin dashboard server component
  - `src/app/(protected)/admin/admin-client.tsx` - Admin dashboard UI

- **Configuration**:
  - `.env.local` - Supabase credentials (DO NOT commit to git!)

---

## 🆘 Support & Troubleshooting

### Common Issues

1. **"Invalid login credentials"**
   - Verify email/password are correct
   - Check if user exists in Supabase Auth panel
   - Try resetting password via Supabase Dashboard

2. **"حسابك معطل" (Account disabled)**
   - User status is not 'active'
   - Run: `UPDATE public.profiles SET status = 'active' WHERE email = '...'`

3. **Redirected to /dashboard instead of /admin**
   - User role is 'user' instead of 'admin'
   - Run: `UPDATE public.profiles SET role = 'admin' WHERE email = '...'`

4. **User not found in profiles table**
   - Database trigger didn't fire
   - Manually create profile using `create_admin_user.sql` script

5. **Can't access admin features**
   - Verify role is 'admin' or 'super_admin'
   - Check browser console for errors
   - Clear browser cache and cookies

### Need Help?

- Check the SQL scripts in `supabase/` directory
- Review the authentication code in `src/lib/auth.ts`
- Inspect browser console for JavaScript errors
- Check Supabase logs in Dashboard → Logs

---

## ✅ Checklist: Setup Verification

Use this checklist to ensure everything is configured correctly:

- [ ] Supabase project is created and accessible
- [ ] Environment variables are set in `.env.local`
- [ ] Database is initialized (`init_database.sql` executed)
- [ ] Admin user is created via Supabase Dashboard
- [ ] Admin user profile exists in `profiles` table
- [ ] Admin user has role = 'admin' or 'super_admin'
- [ ] Admin user has status = 'active'
- [ ] Can login with admin credentials
- [ ] Redirected to `/admin` dashboard after login
- [ ] Can see admin features (User Management, etc.)
- [ ] Can create new users via admin UI

---

## 🎉 Success!

If you've completed all steps, you now have:
- ✅ Working email/password authentication
- ✅ Admin user with access to admin dashboard
- ✅ Role-based access control
- ✅ Automatic redirect based on user role
- ✅ User management capabilities

**Next Steps**:
1. Create additional admin users if needed
2. Start creating regular users for your team
3. Begin using the Salam and Mobily project forms
4. Monitor user activity via the admin dashboard

---

**Last Updated**: 2026-01-21
**Application**: PAA Solutions SaaS
**Version**: 1.0.0
