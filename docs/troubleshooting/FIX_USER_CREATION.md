# Fix User Creation Issue

## Problem
User creation was failing both from the admin dashboard and when creating users manually in Supabase because:
1. The database trigger was failing when `username` wasn't provided
2. The API was conflicting with the trigger by trying to create profiles twice
3. Username uniqueness constraint was causing conflicts

## Solution
Apply the database fix and use the updated API code.

---

## Step 1: Apply Database Fix

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `/supabase/fix_user_creation.sql`
4. Click **Run** to execute the SQL

The script will:
- ✅ Update the `handle_new_user` trigger to handle conflicts gracefully
- ✅ Generate unique usernames automatically when not provided
- ✅ Add error handling to prevent trigger failures
- ✅ Create a helper function for safe user profile creation

### Option B: Using Supabase CLI

```bash
cd /home/user/design-cellular
supabase db push --file supabase/fix_user_creation.sql
```

---

## Step 2: Verify the Fix

### Test Manual User Creation in Supabase

1. Go to **Authentication** → **Users** in Supabase
2. Click **Add user** → **Create new user**
3. Fill in:
   - Email: `test1@example.com`
   - Password: `TestPassword123`
   - Auto Confirm User: ON
4. Click **Create user**
5. Go to **Table Editor** → **profiles**
6. You should see a new profile with auto-generated username like `test1_a1b2c3d4`

### Test API User Creation

1. Log in to your app as admin
2. Go to `/admin`
3. Click **Settings** tab
4. Click **"إضافة مستخدم"** (Add User)
5. Fill in:
   ```
   Username: testuser
   Email: testuser@example.com
   Supervisor: Test Supervisor
   Password: TestPassword123
   ```
6. Click **"إضافة المستخدم"**
7. You should see success message and user in the list

---

## How It Works Now

### Scenario 1: Manual Creation in Supabase
```
User created in auth.users
    ↓
Trigger fires
    ↓
Checks if profile exists (NO)
    ↓
Creates profile with auto-generated username
    ↓
Creates user_settings and module_access
    ↓
✅ Success
```

### Scenario 2: API Creation from Admin Dashboard
```
API creates user in auth.users with metadata
    ↓
Trigger fires
    ↓
Creates profile with username from metadata
    ↓
API waits 500ms
    ↓
API checks if profile exists (YES)
    ↓
API updates profile with correct username/supervisor
    ↓
✅ Success
```

### Scenario 3: Trigger Failure (Now Handled)
```
User created in auth.users
    ↓
Trigger fires but fails (error logged)
    ↓
API waits 500ms
    ↓
API checks if profile exists (NO)
    ↓
API creates profile manually
    ↓
✅ Success (fallback works)
```

---

## What Changed

### Database Trigger (`handle_new_user`)
- ✅ Added `ON CONFLICT DO NOTHING` to prevent duplicate errors
- ✅ Added `IF NOT EXISTS` check before creating profile
- ✅ Auto-generates unique username from email + user ID
- ✅ Added exception handling to prevent auth user creation failure
- ✅ Logs warnings instead of failing silently

### API (`/api/admin/create-user`)
- ✅ Waits for trigger to complete (500ms delay)
- ✅ Checks if profile exists before creating
- ✅ Updates existing profile if trigger created it
- ✅ Creates profile manually if trigger failed
- ✅ Better error messages and logging

---

## Username Generation Logic

When username is not provided in metadata:

1. **First tries**: `user_metadata.username`
2. **Then tries**: `user_metadata.full_name`
3. **Falls back to**: `email_prefix_userid_first8chars`
   - Example: `john@example.com` with ID `a1b2c3d4-...` → `john_a1b2c3d4`

This ensures uniqueness even when multiple users are created without username.

---

## Rollback Instructions

If you need to rollback to the original trigger:

```sql
-- Restore original trigger (less robust version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, email, full_name, username, supervisor_name, role
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        NEW.raw_user_meta_data->>'supervisor_name',
        'user'::user_role
    );

    INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
    VALUES (NEW.id, true, false);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Troubleshooting

### Still getting "Database error"

1. **Check Supabase logs**:
   - Go to Supabase Dashboard → **Logs** → **Postgres Logs**
   - Look for errors related to `handle_new_user` or `profiles`

2. **Verify trigger is updated**:
   ```sql
   SELECT prosrc FROM pg_proc
   WHERE proname = 'handle_new_user';
   ```
   Should contain `ON CONFLICT DO NOTHING`

3. **Check for existing broken users**:
   ```sql
   -- Find auth users without profiles
   SELECT u.id, u.email
   FROM auth.users u
   LEFT JOIN profiles p ON u.id = p.id
   WHERE p.id IS NULL;
   ```

4. **Manually fix broken users**:
   ```sql
   -- Create missing profiles
   INSERT INTO profiles (id, email, username, role, status)
   SELECT
       u.id,
       u.email,
       split_part(u.email, '@', 1) || '_' || substr(u.id::text, 1, 8),
       'user'::user_role,
       'active'::user_status
   FROM auth.users u
   LEFT JOIN profiles p ON u.id = p.id
   WHERE p.id IS NULL;
   ```

### Username conflicts

If you get username uniqueness errors:

```sql
-- Find duplicate usernames
SELECT username, COUNT(*)
FROM profiles
GROUP BY username
HAVING COUNT(*) > 1;

-- Fix by appending user ID
UPDATE profiles
SET username = username || '_' || substr(id::text, 1, 8)
WHERE username IN (
    SELECT username FROM profiles
    GROUP BY username HAVING COUNT(*) > 1
);
```

---

## Summary

✅ Database trigger is now robust and handles edge cases
✅ API has fallback mechanism if trigger fails
✅ Auto-generates unique usernames when not provided
✅ Works for both manual and API user creation
✅ Better error handling and logging
✅ No more silent failures

Apply the fix by running the SQL script in your Supabase dashboard!
