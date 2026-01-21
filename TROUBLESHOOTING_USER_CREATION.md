# Troubleshooting: User Creation Errors in Supabase

## Common Errors When Creating Users via Supabase Dashboard

### Error 1: "Database error saving new user"

**Cause**: The database trigger `handle_new_user()` is failing.

**Solution A: Check if trigger exists**
```sql
-- Run this in SQL Editor to check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Expected result: Should show the trigger on `auth.users` table.

**Solution B: Re-create the trigger**
```sql
-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

**Solution C: Bypass the trigger - Create user manually**

If the trigger keeps failing, create the user without relying on the trigger:

```sql
-- Step 1: First create the user in Supabase Dashboard (Authentication → Users)
--         WITHOUT checking "Auto confirm user" if it causes issues
--         Copy the User ID after creation

-- Step 2: Then manually create the profile
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    role,
    status
) VALUES (
    'PASTE_USER_ID_HERE',  -- UUID from step 1
    'admin@example.com',   -- Email address
    'Admin User',          -- Full name
    'admin',               -- Username (for login)
    'admin',               -- Role: 'user', 'admin', or 'super_admin'
    'active'               -- Status
);

-- Step 3: Create user settings
INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
VALUES ('PASTE_USER_ID_HERE', true, true);

-- Step 4: Grant module access
INSERT INTO public.module_access (user_id, module_type, has_access)
VALUES
    ('PASTE_USER_ID_HERE', 'invoice', true),
    ('PASTE_USER_ID_HERE', 'kdr', true),
    ('PASTE_USER_ID_HERE', 'ga', true),
    ('PASTE_USER_ID_HERE', 'kdr_inv', true),
    ('PASTE_USER_ID_HERE', 'kdr_sellout', true);

-- Step 5: Verify
SELECT id, email, username, role, status FROM public.profiles
WHERE email = 'admin@example.com';
```

---

### Error 2: "User already exists" or "duplicate key value"

**Cause**: A user with that email already exists.

**Solution**: Check existing users and either delete or use a different email

```sql
-- Check if user exists in auth.users
SELECT id, email, created_at, confirmed_at
FROM auth.users
WHERE email = 'admin@example.com';

-- Check if profile exists
SELECT id, email, username, role, status
FROM public.profiles
WHERE email = 'admin@example.com';

-- If you want to delete and start fresh:
DELETE FROM auth.users WHERE email = 'admin@example.com';
-- This will cascade delete the profile due to foreign key
```

---

### Error 3: "Invalid email address"

**Cause**: Email format validation failing.

**Solution**:
- Use a valid email format: `user@domain.com`
- Avoid special characters except `.`, `-`, `_`, `+`
- Don't use spaces

Valid examples:
- ✅ `admin@example.com`
- ✅ `admin.user@company.co`
- ✅ `admin+test@domain.com`
- ❌ `admin@localhost` (no TLD)
- ❌ `admin user@example.com` (has space)

---

### Error 4: "Password does not meet requirements"

**Cause**: Password too short or doesn't meet Supabase requirements.

**Solution**:
- Minimum 8 characters (some Supabase projects require 6)
- Use a mix of letters and numbers for security
- Avoid very simple passwords like "12345678"

**Check your project's password requirements:**
1. Go to Supabase Dashboard → Authentication → Settings
2. Look for "Password Minimum Length"
3. Ensure your password meets or exceeds this length

---

### Error 5: Email confirmation / SMTP not configured

**Cause**: Supabase trying to send confirmation email but SMTP not configured.

**Solution**: Enable auto-confirm

1. **Method A: When creating user**
   - Check the box ✅ **"Auto Confirm User"**
   - This bypasses email verification

2. **Method B: Disable email confirmation globally**
   - Go to Authentication → Settings
   - Scroll to "Email Auth"
   - Toggle OFF "Enable email confirmations"

3. **Method C: Manually confirm user after creation**
   ```sql
   -- Find the user
   SELECT id, email, confirmed_at FROM auth.users
   WHERE email = 'admin@example.com';

   -- Manually confirm them
   UPDATE auth.users
   SET confirmed_at = NOW(),
       email_confirmed_at = NOW()
   WHERE email = 'admin@example.com';
   ```

---

### Error 6: "Failed to create user" (Generic error)

**Cause**: Could be RLS (Row Level Security) policy blocking the operation.

**Solution**: Temporarily check RLS policies

```sql
-- Check if RLS is preventing insertions
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- If needed, temporarily disable RLS for testing (NOT recommended for production)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Try creating user again via Dashboard

-- Re-enable RLS after testing
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

**Better solution**: The `handle_new_user()` function uses `SECURITY DEFINER` which should bypass RLS. If it's not working, recreate the function:

```sql
-- Recreate the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- This is critical - allows function to bypass RLS
SET search_path = public
AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        username,
        supervisor_name,
        role,
        created_by_id,
        created_by_username
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'supervisor_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role),
        (NEW.raw_user_meta_data->>'created_by_id')::UUID,
        NEW.raw_user_meta_data->>'created_by_username'
    );

    -- Create default user settings
    INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
    VALUES (NEW.id, true, false);

    -- Grant access to all modules by default
    INSERT INTO public.module_access (user_id, module_type, has_access)
    VALUES
        (NEW.id, 'invoice', true),
        (NEW.id, 'kdr', true),
        (NEW.id, 'ga', true),
        (NEW.id, 'kdr_inv', true),
        (NEW.id, 'kdr_sellout', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### Error 7: "User created but can't login"

**Cause**: User created in auth.users but profile not created properly.

**Solution**: Check and manually create profile if needed

```sql
-- Check for orphaned auth users (in auth.users but not in profiles)
SELECT au.id, au.email, au.created_at, p.id as profile_id
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'admin@example.com';

-- If profile_id is NULL, manually create the profile
-- Use the INSERT statements from "Error 1 - Solution C" above
```

---

## Quick Diagnostic Script

Run this to check your complete setup:

```sql
-- 1. Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'user_settings', 'module_access')
ORDER BY table_name;

-- 2. Check if trigger exists
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 3. Check if function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user';

-- 4. Check if user exists
SELECT id, email, confirmed_at FROM auth.users
WHERE email = 'admin@example.com';

-- 5. Check if profile exists
SELECT id, email, username, role, status FROM public.profiles
WHERE email = 'admin@example.com';
```

---

## Still Not Working?

### Alternative Method: Create Admin User Entirely via SQL

Skip the Supabase Dashboard user creation entirely and do everything via SQL:

```sql
-- This creates a user with a known password directly in the database
-- IMPORTANT: This is a workaround - normally use the Dashboard

-- 1. Generate a UUID for the user
SELECT gen_random_uuid(); -- Copy this UUID

-- 2. Create the auth user (replace values)
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    role,
    aud
) VALUES (
    'PASTE_UUID_HERE',  -- UUID from step 1
    '00000000-0000-0000-0000-000000000000',
    'admin@example.com',
    crypt('YourSecurePassword123', gen_salt('bf')),  -- Replace with your password
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    'authenticated',
    'authenticated'
);

-- 3. The trigger should create the profile automatically
-- But if not, create manually:
INSERT INTO public.profiles (
    id, email, full_name, username, role, status
) VALUES (
    'PASTE_UUID_HERE',  -- Same UUID
    'admin@example.com',
    'Admin User',
    'admin',
    'admin',
    'active'
);

-- 4. Create settings and module access (see Error 1 - Solution C above)
```

**Note**: The SQL method is advanced. It's better to fix the Dashboard method if possible.

---

## Need More Help?

**Please provide**:
1. The exact error message you're seeing
2. Screenshot of the error (if possible)
3. Output from the "Quick Diagnostic Script" above

**Check Supabase Logs**:
- Go to Supabase Dashboard → Logs
- Look for errors related to user creation
- Share any relevant error messages
