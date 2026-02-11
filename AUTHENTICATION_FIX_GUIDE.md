# Authentication Issues Fix Guide

## 🔴 Errors You're Experiencing

1. **"Failed to get user profile"** - When trying to sign in
2. **"Failed to create user: Database error creating new user"** - When creating users from Supabase dashboard

## 🔍 Root Causes

These errors typically occur due to:

1. **Missing enum value**: The `activation_status` enum is missing the 'confirmed' value
2. **Missing profiles**: Users authenticated but profiles weren't created (trigger failed)
3. **RLS policy issues**: Row Level Security blocking access

## ✅ Fix Steps (Do in Order)

### Step 1: Fix the Enum (CRITICAL - Do This First!)

1. Open **Supabase SQL Editor**
2. Run this script: `/supabase/fix_activation_status_enum.sql`

```sql
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'activation_status'::regtype
        AND enumlabel = 'confirmed'
    ) THEN
        ALTER TYPE activation_status ADD VALUE 'confirmed';
        RAISE NOTICE '✅ Added "confirmed" to activation_status enum';
    END IF;
END $$;
```

**Expected result**: You should see: ✅ Added "confirmed" to activation_status enum

---

### Step 2: Run Diagnostics

Run the diagnostic script to see what's wrong:

1. Open **Supabase SQL Editor**
2. Run: `/supabase/diagnose_auth_issues.sql`
3. Review the output - it will tell you exactly what's missing

Look for:
- ❌ Missing 'confirmed' in activation_status enum
- ❌ Missing profiles for authenticated users
- ❌ Missing trigger `on_auth_user_created`
- ❌ RLS not enabled

---

### Step 3: Create Missing Profiles (If Needed)

If Step 2 showed users without profiles:

1. Open **Supabase SQL Editor**
2. Run: `/supabase/manual_create_missing_profiles.sql`

This will:
- Find all `auth.users` without profiles
- Automatically create profiles, settings, and module access for them

**Expected result**:
```
✅ Created X missing profiles
```

---

### Step 4: Verify Everything Works

1. **Check enum values**:
```sql
SELECT enumlabel FROM pg_enum
WHERE enumtypid = 'activation_status'::regtype
ORDER BY enumsortorder;
```

Should return:
- activated
- activating
- confirmed ✅

2. **Check profiles exist**:
```sql
SELECT COUNT(*) FROM auth.users;  -- Total auth users
SELECT COUNT(*) FROM public.profiles;  -- Total profiles
-- These numbers should match!
```

3. **Try creating a user from Supabase Dashboard**:
   - Go to Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Should work without errors now ✅

4. **Try logging in**:
   - Use your login page
   - Should successfully authenticate and load profile ✅

---

## 🔧 If Still Not Working

### Check Supabase Logs

1. Go to Supabase Dashboard → Logs → Postgres Logs
2. Look for errors when creating users or signing in
3. Common errors to look for:
   - `invalid input value for enum activation_status: "confirmed"`
   - `null value in column "..." violates not-null constraint`
   - `function public.handle_new_user() does not exist`

### Re-run Complete Setup (Nuclear Option)

If nothing else works:

1. **Backup your data first!**
2. Run: `/supabase/complete_database_setup.sql`
   - This will recreate all tables, triggers, functions, and policies
   - It's idempotent (safe to run multiple times)

---

## 📝 Quick Reference

| Issue | Fix Script | Location |
|-------|-----------|----------|
| Missing enum value | `fix_activation_status_enum.sql` | `/supabase/` |
| Diagnose issues | `diagnose_auth_issues.sql` | `/supabase/` |
| Missing profiles | `manual_create_missing_profiles.sql` | `/supabase/` |
| Complete reset | `complete_database_setup.sql` | `/supabase/` |

---

## 🎯 Prevention

To prevent these issues in the future:

1. Always run `fix_activation_status_enum.sql` first before creating users
2. Check Postgres logs after creating users to ensure triggers fired
3. Run diagnostics periodically to catch issues early
4. Keep the `complete_database_setup.sql` updated with all enum values

---

## 💡 Understanding What Happened

### Why "Failed to get user profile"?

1. User successfully authenticated with Supabase Auth (stored in `auth.users`)
2. App tries to fetch profile from `public.profiles` table
3. Profile doesn't exist because the trigger failed when user was created
4. Trigger failed because enum was missing 'confirmed' value

### Why "Failed to create user: Database error"?

1. Supabase tries to create user in `auth.users` ✅
2. Trigger `on_auth_user_created` automatically fires
3. Trigger calls `handle_new_user()` function
4. Function tries to insert into `profiles` table
5. Insert fails because `activation_status` column type expects enum with 'confirmed'
6. Enum doesn't have 'confirmed' value ❌
7. Entire transaction rolls back, user creation fails

### The Fix

By adding 'confirmed' to the enum, the trigger can now complete successfully, and profiles are created automatically for new users.

---

## 📞 Need Help?

If you're still experiencing issues after following this guide:

1. Run the diagnostic script and save the output
2. Check Supabase Postgres logs for specific error messages
3. Provide both when asking for help

---

**Created**: 2026-02-11
**Last Updated**: 2026-02-11
**Related Scripts**:
- `fix_activation_status_enum.sql`
- `diagnose_auth_issues.sql`
- `manual_create_missing_profiles.sql`
- `complete_database_setup.sql`
