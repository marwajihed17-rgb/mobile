-- ============================================
-- DIAGNOSTIC SCRIPT FOR AUTH AND USER CREATION ISSUES
-- ============================================
-- Run this to check what's causing authentication and user creation errors
-- ============================================

-- 1. Check if activation_status enum has all required values
SELECT '=== 1. Checking activation_status enum values ===' as step;
SELECT enumlabel as enum_value
FROM pg_enum
WHERE enumtypid = 'activation_status'::regtype
ORDER BY enumsortorder;

-- Expected: activated, activating, confirmed
-- If 'confirmed' is missing, run: supabase/fix_activation_status_enum.sql

-- 2. Check if profiles table exists and its structure
SELECT '=== 2. Checking profiles table structure ===' as step;
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check if trigger exists for auto-creating profiles
SELECT '=== 3. Checking handle_new_user trigger ===' as step;
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. Check if helper functions exist
SELECT '=== 4. Checking helper functions ===' as step;
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('handle_new_user', 'is_admin', 'is_super_admin')
ORDER BY routine_name;

-- 5. Check RLS policies on profiles table
SELECT '=== 5. Checking RLS policies on profiles ===' as step;
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 6. Check if RLS is enabled
SELECT '=== 6. Checking if RLS is enabled ===' as step;
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('profiles', 'user_settings', 'module_access')
ORDER BY tablename;

-- 7. Test the handle_new_user function (simulation)
SELECT '=== 7. Testing enum cast ===' as step;
SELECT
    'user'::user_role as test_user_role,
    'active'::user_status as test_user_status,
    'confirmed'::activation_status as test_activation_status;
-- If this fails with "invalid input value for enum", the enum needs to be fixed

-- 8. Check existing profiles
SELECT '=== 8. Checking existing profiles count ===' as step;
SELECT
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
    COUNT(CASE WHEN role = 'user' THEN 1 END) as users,
    COUNT(CASE WHEN role = 'operator' THEN 1 END) as operators
FROM public.profiles;

-- 9. Check auth.users vs profiles mismatch
SELECT '=== 9. Checking for auth.users without profiles ===' as step;
SELECT
    au.id,
    au.email,
    au.created_at as auth_created_at,
    CASE
        WHEN p.id IS NULL THEN 'MISSING PROFILE'
        ELSE 'HAS PROFILE'
    END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 10. Check module_type enum
SELECT '=== 10. Checking module_type enum values ===' as step;
SELECT enumlabel as module_type_value
FROM pg_enum
WHERE enumtypid = 'module_type'::regtype
ORDER BY enumsortorder;

-- Expected: invoice, kdr, ga, kdr_inv, kdr_sellout

-- ============================================
-- SUMMARY & RECOMMENDATIONS
-- ============================================
SELECT '=== DIAGNOSTIC COMPLETE ===' as step;
SELECT '
TROUBLESHOOTING STEPS:

1. If "confirmed" is missing from activation_status enum:
   → Run: supabase/fix_activation_status_enum.sql

2. If trigger "on_auth_user_created" is missing:
   → Run the complete_database_setup.sql script

3. If you see "MISSING PROFILE" in step 9:
   → The trigger failed or didn''t fire
   → Check Supabase logs for trigger errors
   → Manually create profile for that user

4. If RLS is not enabled:
   → Run: ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

5. If policies are missing:
   → Re-run the RLS section of complete_database_setup.sql

6. To manually create a profile for a user:
   INSERT INTO public.profiles (id, email, username, role)
   VALUES (
     ''USER_UUID_HERE'',
     ''user@example.com'',
     ''username'',
     ''user''
   );

7. Common error "Failed to get user profile":
   → User authenticated but profile doesn''t exist
   → Check step 9 above
   → Trigger might have failed due to enum error

8. Common error "Failed to create user: Database error":
   → Check Supabase logs for exact error
   → Usually caused by missing enum values or constraint violations
' as recommendations;
