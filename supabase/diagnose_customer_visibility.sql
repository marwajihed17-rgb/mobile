-- ============================================
-- DIAGNOSE CUSTOMER DATA VISIBILITY ISSUE
-- ============================================
-- Use this when customers are created but not visible in admin dashboard
-- Error: "لا توجد بيانات عملاء في النظام"
-- ============================================

-- 1. Check if customers actually exist in the database
SELECT '=== 1. Customer Data in Database ===' as step;
SELECT
    'Salam Customers' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_count
FROM public.salam_customers
UNION ALL
SELECT
    'Mobily Customers' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_count
FROM public.mobily_customers;

-- 2. Show recent customers (bypassing RLS)
SELECT '=== 2. Recent Salam Customers (Last 10) ===' as step;
SELECT
    sc.id,
    sc.name,
    sc.identity_number,
    sc.phone_number,
    sc.user_id,
    sc.operator_id,
    sc.activation_status,
    sc.created_at,
    p.email as created_by_email,
    p.role as created_by_role
FROM public.salam_customers sc
LEFT JOIN public.profiles p ON sc.user_id = p.id
ORDER BY sc.created_at DESC
LIMIT 10;

SELECT '=== 3. Recent Mobily Customers (Last 10) ===' as step;
SELECT
    mc.id,
    mc.name,
    mc.identity_number,
    mc.phone_number,
    mc.user_id,
    mc.operator_id,
    mc.activation_status,
    mc.created_at,
    p.email as created_by_email,
    p.role as created_by_role
FROM public.mobily_customers mc
LEFT JOIN public.profiles p ON mc.user_id = p.id
ORDER BY mc.created_at DESC
LIMIT 10;

-- 4. Check RLS policies
SELECT '=== 4. RLS Policies on Customer Tables ===' as step;
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    LEFT(qual, 100) as qual_preview,
    LEFT(with_check, 100) as with_check_preview
FROM pg_policies
WHERE tablename IN ('salam_customers', 'mobily_customers')
ORDER BY tablename, cmd, policyname;

-- 5. Check if is_admin function exists and works
SELECT '=== 5. Testing is_admin Function ===' as step;
SELECT
    p.id,
    p.email,
    p.role,
    public.is_admin(p.id) as is_admin_result,
    CASE
        WHEN public.is_admin(p.id) = true THEN '✅ Function returns TRUE'
        WHEN public.is_admin(p.id) = false THEN '❌ Function returns FALSE'
        ELSE '❌ Function returns NULL'
    END as function_status
FROM public.profiles p
WHERE p.role IN ('admin', 'super_admin')
ORDER BY p.created_at DESC;

-- 6. Check admin user details
SELECT '=== 6. Admin User Details ===' as step;
SELECT
    p.id,
    p.email,
    p.username,
    p.role,
    p.status,
    CASE
        WHEN p.role IN ('admin', 'super_admin') AND p.status = 'active'
        THEN '✅ Should see all customers'
        WHEN p.role IN ('admin', 'super_admin') AND p.status != 'active'
        THEN '⚠️  Admin but account inactive'
        ELSE '❌ Not an admin'
    END as expected_access
FROM public.profiles p
WHERE p.role IN ('admin', 'super_admin')
   OR p.email LIKE '%admin%';

-- 7. Test RLS policy manually
SELECT '=== 7. Testing RLS Policy for Current User ===' as step;
-- This simulates what happens when admin tries to fetch customers
SELECT
    'If you can see customer records below, RLS is working' as note;

-- Try to select customers (this will respect RLS)
SELECT
    sc.id,
    sc.name,
    sc.user_id,
    p.email as created_by,
    sc.created_at
FROM public.salam_customers sc
LEFT JOIN public.profiles p ON sc.user_id = p.id
ORDER BY sc.created_at DESC
LIMIT 5;

-- 8. Check for orphaned customers
SELECT '=== 8. Customers with Invalid user_id ===' as step;
SELECT
    'Salam' as project,
    COUNT(*) as orphaned_count
FROM public.salam_customers sc
LEFT JOIN public.profiles p ON sc.user_id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT
    'Mobily' as project,
    COUNT(*) as orphaned_count
FROM public.mobily_customers mc
LEFT JOIN public.profiles p ON mc.user_id = p.id
WHERE p.id IS NULL;

-- ============================================
-- COMMON ISSUES AND FIXES
-- ============================================

SELECT '
🔍 DIAGNOSIS GUIDE:

ISSUE 1: Customers exist but admin cannot see them
CAUSE: is_admin() function returns FALSE or NULL
FIX:
  - Check step 5 above
  - If is_admin returns FALSE, the user role is not admin/super_admin
  - Run: UPDATE public.profiles SET role = ''super_admin'' WHERE email = ''your@email.com'';

ISSUE 2: is_admin function does not exist
FIX:
  - Re-run complete_database_setup.sql to create the function

ISSUE 3: RLS policies are missing
FIX:
  - Check step 4 - should show policies like "Admins can view all salam customers"
  - If missing, re-run the RLS section of complete_database_setup.sql

ISSUE 4: Customers were created with wrong user_id
CAUSE: Customer was created but user_id does not match admin''s id
FIX:
  - Customers with user_id != admin id are only visible to their creator
  - Admins should see ALL customers regardless of user_id
  - If admin cannot see ANY customers, the is_admin function is the problem

ISSUE 5: RLS is working but supabase client is not authenticated
CAUSE: The query is running without auth.uid() being set
FIX:
  - Make sure you''re using the authenticated supabase client
  - Check that the session is valid

QUICK FIX: Temporarily disable RLS (NOT RECOMMENDED FOR PRODUCTION)
-- ALTER TABLE public.salam_customers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.mobily_customers DISABLE ROW LEVEL SECURITY;

PROPER FIX: Ensure is_admin function works correctly
' as troubleshooting_guide;

-- ============================================
-- VERIFY is_admin FUNCTION
-- ============================================

SELECT '=== VERIFY: is_admin Function Definition ===' as step;
SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'is_admin';

-- If the function is not shown above, create it:
/*
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = check_user_id
        AND role IN ('admin', 'super_admin')
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
