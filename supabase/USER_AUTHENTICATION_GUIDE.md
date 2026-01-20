# User Creation & Authentication Guide

## 🎯 Overview

This guide explains how to create users and handle authentication in your PAA Solutions application with Supabase.

---

## 📋 Table of Contents

1. [First Admin User Setup](#first-admin-user-setup)
2. [Create Additional Users (Admin Panel)](#create-additional-users-admin-panel)
3. [Create Users (Supabase Dashboard)](#create-users-supabase-dashboard)
4. [How Authentication Works](#how-authentication-works)
5. [Testing Login](#testing-login)
6. [Troubleshooting](#troubleshooting)

---

## 🔐 First Admin User Setup

After rebuilding your database, you need to create the first super admin user.

### Step 1: Create User in Supabase Auth

1. **Go to Supabase Dashboard**
   - Open: https://app.supabase.com
   - Select your project
   - Navigate to: **Authentication** → **Users**

2. **Click "Add user"**
   - Choose: **"Create new user"**

3. **Fill in the form:**
   ```
   Email: admin@example.com
   Password: YourSecurePassword123!
   Auto Confirm: ✅ (Check this box!)
   ```

4. **Click "Create user"**
   - User is now created in `auth.users` table
   - Profile is automatically created via trigger

### Step 2: Upgrade to Super Admin

1. **Go to SQL Editor**
   - In Supabase Dashboard: **SQL Editor**

2. **Run this query:**
   ```sql
   UPDATE public.profiles
   SET role = 'super_admin'
   WHERE email = 'admin@example.com';
   ```

3. **Verify it worked:**
   ```sql
   SELECT id, email, username, role, status
   FROM public.profiles
   WHERE email = 'admin@example.com';
   ```

   Should show:
   ```
   role: super_admin
   status: active
   ```

### Step 3: Test Login

1. Go to your application: `http://localhost:3000`
2. Login with:
   - Email: `admin@example.com`
   - Password: `YourSecurePassword123!`
3. You should be redirected to the dashboard
4. Navigate to `/admin` - you should have full access

---

## 👥 Create Additional Users (Admin Panel)

Once you have a super admin, you can create users through the admin panel.

### Using the Admin Dashboard

1. **Login as super admin**

2. **Navigate to Admin Panel**
   - Go to: `/admin` or click "Admin" in navigation

3. **Go to User Management Tab**
   - Click the "User Management" tab

4. **Click "Create New User"**

5. **Fill in the form:**
   ```
   Full Name: John Doe
   Username: johndoe (unique, required)
   Email: john@example.com
   Password: SecurePassword123!
   Supervisor Name: Manager Name (optional)
   Role: user | admin | super_admin
   Status: active
   ```

6. **Click "Create User"**
   - User is created via API route: `/api/admin/create-user`
   - Profile and settings are auto-generated

### What Happens Behind the Scenes

The admin panel calls this API:

```typescript
// POST /api/admin/create-user
{
  email: "john@example.com",
  password: "SecurePassword123!",
  full_name: "John Doe",
  username: "johndoe",
  supervisor_name: "Manager Name",
  role: "user"
}
```

The API:
1. Creates user in `auth.users`
2. Trigger automatically creates `profiles` entry
3. Trigger creates `user_settings` entry
4. Returns success/error

---

## 🔧 Create Users (Supabase Dashboard)

You can also create users manually via Supabase Dashboard.

### Method 1: Via Authentication Panel

1. **Go to Authentication → Users**
2. **Click "Add user" → "Create new user"**
3. **Fill in:**
   ```
   Email: user@example.com
   Password: Password123!
   Auto Confirm: ✅ (Important!)
   ```
4. **Click "Create user"**

The trigger will automatically:
- Create profile in `public.profiles`
- Create settings in `public.user_settings`
- Set default role to `user`

### Method 2: Via SQL Editor

```sql
-- This creates a user with metadata
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'newuser@example.com',
    crypt('Password123!', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
        'full_name', 'New User',
        'username', 'newuser',
        'supervisor_name', 'Supervisor Name',
        'role', 'user'
    ),
    NOW(),
    NOW()
);
```

**Note:** This is complex. It's easier to use the Authentication panel or admin dashboard.

---

## 🔑 How Authentication Works

### Authentication Flow

```
1. User enters email + password
   ↓
2. Supabase Auth validates credentials
   ↓
3. JWT token is generated
   ↓
4. Token stored in browser (cookie/localStorage)
   ↓
5. App uses token to authenticate API requests
   ↓
6. RLS policies check auth.uid() for permissions
```

### Your Application's Auth Setup

Your app uses Supabase Auth with Next.js:

**Login Location:** `/src/app/login/page.tsx`

**Authentication Code:**
```typescript
import { createClient } from '@/lib/supabase/client'

// Login
const supabase = createClient()
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

if (error) {
  console.error('Login failed:', error.message)
} else {
  console.log('Logged in:', data.user)
  // Redirect to dashboard
}
```

**Logout Code:**
```typescript
const { error } = await supabase.auth.signOut()
if (!error) {
  // Redirect to login
}
```

**Check Current User:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (user) {
  console.log('Logged in as:', user.email)
}
```

### Role-Based Access Control (RBAC)

Your database has 3 roles:

| Role | Permissions |
|------|-------------|
| **user** | View/edit own data only |
| **admin** | View all data, manage customers, no user management |
| **super_admin** | Full access, can create/delete users |

**Checking roles in code:**
```typescript
// Get user profile with role
const { data: profile } = await supabase
  .from('profiles')
  .select('role, status')
  .eq('id', user.id)
  .single()

if (profile.role === 'super_admin') {
  // Show admin features
}
```

**RLS automatically enforces permissions:**
- Users can only see their own customers
- Admins can see all customers
- Only super admins can modify user roles

---

## ✅ Testing Login

### Test 1: Login Flow

1. **Go to login page:** `http://localhost:3000/login`

2. **Enter credentials:**
   ```
   Email: admin@example.com
   Password: YourSecurePassword123!
   ```

3. **Click "Login" or "Sign In"**

4. **Expected result:**
   - Successful login
   - Redirected to dashboard/home
   - Navigation shows user info
   - Can access admin panel (if super admin)

### Test 2: Protected Routes

1. **Without logging in, try to access:**
   - `/admin` - Should redirect to login
   - `/dashboard` - Should redirect to login

2. **After logging in:**
   - Should have access to allowed routes
   - Admin routes only accessible to admins/super admins

### Test 3: Role Permissions

**As regular user:**
```sql
-- First create a regular user and login
-- Try to access admin panel: /admin
-- Should see: "Access Denied" or redirect
```

**As admin:**
```sql
-- Login as admin
-- Can access: /admin (view customers, stats)
-- Cannot: Create/delete users
```

**As super admin:**
```sql
-- Login as super admin
-- Can access: Everything including user management
```

### Test 4: Database Query Test

After logging in, check if you can query your data:

```typescript
// Try this in a server component or API route
const supabase = createClient()

// Get current user's customers
const { data: customers, error } = await supabase
  .from('customers')
  .select('*')
  .eq('project', 'salam')

console.log('Customers:', customers)
```

---

## 🐛 Troubleshooting

### Problem: "Invalid login credentials"

**Causes:**
1. Wrong email or password
2. User not confirmed
3. User doesn't exist

**Solution:**
```sql
-- Check if user exists
SELECT email, email_confirmed_at
FROM auth.users
WHERE email = 'user@example.com';

-- If email_confirmed_at is NULL, confirm the user:
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com';
```

### Problem: "User not found" after login

**Cause:** Profile wasn't created by trigger

**Solution:**
```sql
-- Check if profile exists
SELECT * FROM public.profiles
WHERE email = 'user@example.com';

-- If not, create it manually:
INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    role
)
SELECT
    id,
    email,
    COALESCE(raw_user_meta_data->>'username', email),
    COALESCE(raw_user_meta_data->>'full_name', email),
    'user'::user_role
FROM auth.users
WHERE email = 'user@example.com';
```

### Problem: "Access denied" to admin panel

**Cause:** User doesn't have admin role

**Solution:**
```sql
-- Check current role
SELECT email, role, status
FROM public.profiles
WHERE email = 'user@example.com';

-- Update role
UPDATE public.profiles
SET role = 'admin'  -- or 'super_admin'
WHERE email = 'user@example.com';
```

### Problem: Can't create users via admin panel

**Cause:** Not super admin or API route error

**Solution:**
```sql
-- Verify you're super admin
SELECT email, role
FROM public.profiles
WHERE id = auth.uid();

-- Check API route exists:
-- /src/app/api/admin/create-user/route.ts
```

### Problem: Password reset not working

**Solution:**
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find the user
3. Click "..." → **Reset password**
4. User will receive email with reset link

Or via SQL:
```sql
-- Force password reset via dashboard only
-- Cannot set password directly via SQL for security
```

### Problem: Session expires too quickly

**Solution:**
Check your Supabase project settings:
1. **Authentication** → **Settings**
2. **JWT expiry:** Default is 1 hour
3. Increase if needed (e.g., 7 days)

---

## 🔒 Security Best Practices

### 1. Strong Passwords
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, symbols
- Don't use common passwords

### 2. Email Confirmation
- Always enable "Auto Confirm" for manually created users
- Or send confirmation email for production

### 3. Role Management
- Only super admins can change roles
- Regular users can't elevate their own permissions (RLS prevents this)

### 4. Audit Logging
- All admin actions are logged in `audit_logs` table
- Review regularly for suspicious activity

### 5. Environment Variables
Keep your Supabase credentials secure:

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (server only!)
```

**Never commit service role key to git!**

---

## 📚 Quick Reference

### Create First Admin (SQL)
```sql
-- After creating user in Auth panel
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'admin@example.com';
```

### Check Current User (TypeScript)
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### Login (TypeScript)
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### Logout (TypeScript)
```typescript
await supabase.auth.signOut()
```

### Get User Profile (TypeScript)
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

---

## ✅ Setup Checklist

After database rebuild:

- [ ] Database rebuilt successfully
- [ ] First user created via Supabase Auth
- [ ] First user upgraded to super_admin
- [ ] Can login to application
- [ ] Can access admin panel
- [ ] Can create additional users
- [ ] RLS policies working (users see only their data)
- [ ] Role-based access working
- [ ] Password reset tested
- [ ] Session persistence working

---

## 🎉 You're All Set!

Your authentication system is now ready. You can:

1. ✅ Create users via admin panel
2. ✅ Login/logout securely
3. ✅ Role-based permissions enforced
4. ✅ All actions audited

**Next steps:**
- Create your team users
- Test customer data entry
- Verify admin dashboard features
- Set up production email templates (optional)

---

## 📞 Need Help?

Common issues:
- User can't login → Check email confirmation
- No admin access → Verify role in profiles table
- Can't create users → Verify super_admin role
- Session issues → Check JWT expiry settings

Check the database with:
```sql
-- See all users and their roles
SELECT
    p.email,
    p.username,
    p.role,
    p.status,
    p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;
```
