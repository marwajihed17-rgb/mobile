-- ============================================
-- MANUAL ADMIN USER CREATION SCRIPT
-- ============================================
-- Use this script to manually create an admin user in Supabase
-- This is useful when you need to create the first admin or
-- when the automatic trigger isn't working
-- ============================================

-- OPTION 1: Update existing user to admin
-- Replace 'user-email@example.com' with the actual email
-- ============================================

-- Step 1: Find the user ID (run this first to get the user_id)
SELECT id, email, role FROM auth.users WHERE email = 'user-email@example.com';

-- Step 2: Update the profile to make them an admin
-- Replace 'USER_ID_HERE' with the ID from step 1
UPDATE public.profiles
SET
    role = 'admin',  -- or 'super_admin' for super admin privileges
    status = 'active'
WHERE id = 'USER_ID_HERE';

-- Verify the update
SELECT id, email, username, role, status
FROM public.profiles
WHERE id = 'USER_ID_HERE';


-- ============================================
-- OPTION 2: Create a brand new admin user from scratch
-- Use this if you need to manually create the entire user
-- ============================================

-- NOTE: This requires manual password setup via Supabase Dashboard
-- After creating the auth user, run this:

-- Replace these values:
-- - NEW_USER_ID: The UUID from auth.users after creating via dashboard
-- - admin@example.com: The email address
-- - Admin User: The full name
-- - adminuser: The username (must be unique)

INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    supervisor_name,
    role,
    status
) VALUES (
    'NEW_USER_ID',  -- Replace with actual UUID from auth.users
    'admin@example.com',  -- Replace with actual email
    'Admin User',  -- Replace with actual full name
    'adminuser',  -- Replace with actual username (must be unique)
    NULL,  -- Optional supervisor name
    'admin',  -- Role: 'admin' or 'super_admin'
    'active'  -- Status: must be 'active' to login
);

-- Create default settings for the admin
INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
VALUES ('NEW_USER_ID', true, true);  -- Replace NEW_USER_ID

-- Grant module access
INSERT INTO public.module_access (user_id, module_type, has_access)
VALUES
    ('NEW_USER_ID', 'invoice', true),
    ('NEW_USER_ID', 'kdr', true),
    ('NEW_USER_ID', 'ga', true),
    ('NEW_USER_ID', 'kdr_inv', true),
    ('NEW_USER_ID', 'kdr_sellout', true);  -- Replace NEW_USER_ID for all rows


-- ============================================
-- OPTION 3: Quick admin promotion
-- Use this one-liner to quickly promote a user to admin
-- ============================================

-- By email:
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email = 'user@example.com';

-- By username:
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE username = 'username';


-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all admin users
SELECT id, email, username, role, status, created_at
FROM public.profiles
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- Check user settings for admin
SELECT p.email, p.username, p.role, us.dashboard_access, us.admin_privileges
FROM public.profiles p
LEFT JOIN public.user_settings us ON p.id = us.user_id
WHERE p.role IN ('admin', 'super_admin');

-- Count users by role
SELECT role, COUNT(*) as user_count
FROM public.profiles
GROUP BY role
ORDER BY user_count DESC;


-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If a user can't login, check their status:
SELECT id, email, username, role, status
FROM public.profiles
WHERE email = 'user@example.com';

-- If status is 'inactive' or 'suspended', activate them:
UPDATE public.profiles
SET status = 'active'
WHERE email = 'user@example.com';

-- Check if user exists in auth.users but not in profiles:
SELECT au.id, au.email, au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- If user exists in auth.users but not in profiles, create profile manually:
-- Use OPTION 2 above
