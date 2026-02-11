-- ============================================
-- VERIFY ADMIN LOGIN ISSUE
-- ============================================
-- Run this to check why admin users aren't reaching admin dashboard
-- ============================================

-- 1. Check all users and their roles
SELECT '=== 1. All users and their roles ===' as step;
SELECT
    p.id,
    p.email,
    p.username,
    p.role,
    p.status,
    p.created_at,
    CASE
        WHEN p.role = 'super_admin' THEN '✅ SUPER ADMIN'
        WHEN p.role = 'admin' THEN '✅ ADMIN'
        WHEN p.role = 'operator' THEN 'ℹ️  OPERATOR'
        WHEN p.role = 'user' THEN 'ℹ️  USER'
        ELSE '❌ UNKNOWN ROLE'
    END as role_status,
    CASE
        WHEN p.status = 'active' THEN '✅ ACTIVE'
        WHEN p.status = 'inactive' THEN '⚠️  INACTIVE'
        WHEN p.status = 'suspended' THEN '❌ SUSPENDED'
        ELSE '❌ UNKNOWN STATUS'
    END as account_status
FROM public.profiles p
ORDER BY
    CASE p.role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'operator' THEN 3
        WHEN 'user' THEN 4
    END,
    p.created_at DESC;

-- 2. Check for users that should be admin but aren't
SELECT '=== 2. Users with admin email patterns but wrong role ===' as step;
SELECT
    p.email,
    p.username,
    p.role,
    '❌ Should probably be admin!' as issue
FROM public.profiles p
WHERE (
    p.email LIKE '%admin%'
    OR p.email = 'admin@retaam.app'
    OR p.username = 'admin'
)
AND p.role NOT IN ('admin', 'super_admin');

-- 3. Check specific admin user (UPDATE THE EMAIL)
SELECT '=== 3. Checking specific admin user ===' as step;
SELECT
    p.id,
    p.email,
    p.username,
    p.full_name,
    p.role,
    p.status,
    CASE
        WHEN p.role IN ('admin', 'super_admin') AND p.status = 'active'
        THEN '✅ Ready to access admin dashboard'
        WHEN p.role IN ('admin', 'super_admin') AND p.status != 'active'
        THEN '❌ Admin role but account not active'
        WHEN p.role NOT IN ('admin', 'super_admin')
        THEN '❌ Not an admin - need to upgrade role'
        ELSE '❌ Unknown issue'
    END as admin_access_status
FROM public.profiles p
WHERE p.email = 'admin@retaam.app'  -- ⚠️ UPDATE THIS TO YOUR ADMIN EMAIL
   OR p.username = 'admin';         -- ⚠️ OR UPDATE THIS TO YOUR ADMIN USERNAME

-- 4. Test admin access functions
SELECT '=== 4. Testing admin check functions ===' as step;
SELECT
    p.id,
    p.email,
    p.role,
    public.is_admin(p.id) as is_admin_result,
    public.is_super_admin(p.id) as is_super_admin_result
FROM public.profiles p
WHERE p.role IN ('admin', 'super_admin')
ORDER BY p.role, p.created_at DESC;

-- 5. Check auth.users vs profiles alignment
SELECT '=== 5. Auth users vs profiles alignment ===' as step;
SELECT
    au.id,
    au.email,
    au.email_confirmed_at,
    p.role,
    p.status,
    CASE
        WHEN p.id IS NULL THEN '❌ NO PROFILE - Run manual_create_missing_profiles.sql'
        WHEN p.role = 'user' AND au.email LIKE '%admin%' THEN '⚠️  Has profile but wrong role'
        ELSE '✅ OK'
    END as alignment_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;

-- ============================================
-- QUICK FIXES
-- ============================================

SELECT '=== QUICK FIX: Upgrade user to super admin ===' as solution;

-- To upgrade a specific user to super_admin, uncomment and run:
/*
UPDATE public.profiles
SET
    role = 'super_admin',
    status = 'active'
WHERE email = 'YOUR_ADMIN_EMAIL_HERE';  -- ⚠️ UPDATE THIS
*/

-- Or upgrade by username:
/*
UPDATE public.profiles
SET
    role = 'super_admin',
    status = 'active'
WHERE username = 'YOUR_ADMIN_USERNAME_HERE';  -- ⚠️ UPDATE THIS
*/

-- ============================================
-- VERIFY THE FIX
-- ============================================

SELECT '=== VERIFY: Check admin users after fix ===' as verification;
SELECT
    email,
    username,
    role,
    status,
    CASE
        WHEN role IN ('admin', 'super_admin') AND status = 'active'
        THEN '✅ Can access admin dashboard'
        ELSE '❌ Cannot access admin dashboard'
    END as admin_dashboard_access
FROM public.profiles
WHERE role IN ('admin', 'super_admin')
   OR email LIKE '%admin%';

-- ============================================
-- TROUBLESHOOTING SUMMARY
-- ============================================

SELECT '
🔍 TROUBLESHOOTING GUIDE

ISSUE: Admin user not redirected to admin dashboard

COMMON CAUSES:
1. ❌ User profile has role = "user" instead of "admin" or "super_admin"
2. ❌ User profile has status = "inactive" or "suspended"
3. ❌ User profile doesn''t exist (auth user exists but no profile)
4. ❌ Middleware not fetching profile correctly

FIXES:
1. Run step 1-3 above to identify the specific issue
2. If role is wrong, run the UPDATE query in "QUICK FIX" section
3. If profile is missing, run: supabase/manual_create_missing_profiles.sql
4. If status is not active, run:
   UPDATE public.profiles SET status = ''active'' WHERE email = ''your@email.com'';

EXPECTED BEHAVIOR:
✅ Admin logs in
✅ Middleware fetches profile
✅ Middleware sees role = ''admin'' or ''super_admin''
✅ Middleware redirects to /admin
✅ Admin page checks role again
✅ Admin page loads dashboard

If user reaches /admin but gets redirected to /dashboard:
→ Their role in profiles table is ''user'', not ''admin''
→ Update their role using the UPDATE query above
' as guide;
