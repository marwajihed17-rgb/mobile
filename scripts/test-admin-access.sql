-- Test Admin Dashboard Access
-- Run this script to verify database setup and admin access

-- ============================================
-- 1. Check if customer tables exist and have data
-- ============================================

SELECT 'SALAM CUSTOMERS COUNT' as test, COUNT(*)::text as result FROM salam_customers
UNION ALL
SELECT 'MOBILY CUSTOMERS COUNT', COUNT(*)::text FROM mobily_customers
UNION ALL
SELECT 'PROFILES COUNT', COUNT(*)::text FROM profiles
UNION ALL

-- ============================================
-- 2. Check admin users
-- ============================================

SELECT 'ADMIN USERS' as test, COUNT(*)::text as result
FROM profiles
WHERE role IN ('admin', 'super_admin') AND status = 'active'
UNION ALL

-- ============================================
-- 3. Verify RLS is enabled
-- ============================================

SELECT 'SALAM RLS ENABLED' as test,
  CASE WHEN relrowsecurity THEN 'YES' ELSE 'NO' END as result
FROM pg_class
WHERE relname = 'salam_customers'
UNION ALL

SELECT 'MOBILY RLS ENABLED' as test,
  CASE WHEN relrowsecurity THEN 'YES' ELSE 'NO' END as result
FROM pg_class
WHERE relname = 'mobily_customers'
UNION ALL

-- ============================================
-- 4. List all RLS policies
-- ============================================

SELECT 'SALAM POLICIES COUNT' as test, COUNT(*)::text as result
FROM pg_policies
WHERE tablename = 'salam_customers'
UNION ALL

SELECT 'MOBILY POLICIES COUNT' as test, COUNT(*)::text as result
FROM pg_policies
WHERE tablename = 'mobily_customers';

-- ============================================
-- 5. Sample data from each table (limit 3)
-- ============================================

SELECT '=== SALAM CUSTOMERS SAMPLE ===' as info;
SELECT id, name, identity_number, created_by_username, created_at
FROM salam_customers
ORDER BY created_at DESC
LIMIT 3;

SELECT '=== MOBILY CUSTOMERS SAMPLE ===' as info;
SELECT id, name, identity_number, created_by_username, created_at
FROM mobily_customers
ORDER BY created_at DESC
LIMIT 3;

-- ============================================
-- 6. Check profiles table for user linkage
-- ============================================

SELECT '=== ADMIN PROFILES ===' as info;
SELECT id, email, username, role, status
FROM profiles
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- ============================================
-- 7. Test the is_admin function
-- ============================================

-- Replace 'YOUR_USER_ID' with an actual admin user ID from the profiles table
-- SELECT is_admin('YOUR_USER_ID'::uuid) as is_admin_test;

-- ============================================
-- 8. Check for orphaned records (customers without valid user_id)
-- ============================================

SELECT 'ORPHANED SALAM CUSTOMERS' as test, COUNT(*)::text as result
FROM salam_customers s
LEFT JOIN profiles p ON s.user_id = p.id
WHERE p.id IS NULL
UNION ALL

SELECT 'ORPHANED MOBILY CUSTOMERS' as test, COUNT(*)::text as result
FROM mobily_customers m
LEFT JOIN profiles p ON m.user_id = p.id
WHERE p.id IS NULL;

-- ============================================
-- 9. Test daily count functions
-- ============================================

SELECT 'SALAM DAILY COUNT' as test, get_salam_daily_count()::text as result
UNION ALL
SELECT 'MOBILY DAILY COUNT', get_mobily_daily_count()::text;

-- ============================================
-- Instructions
-- ============================================

/*
EXPECTED RESULTS:

1. Customer tables should have COUNT > 0 if you have data
2. At least one admin user should exist (ADMIN USERS > 0)
3. RLS should be ENABLED for both tables
4. Each table should have 7 policies (view own, admin view all, insert, update own, admin update, delete own, admin delete)
5. Sample data should show recent customer records
6. Admin profiles should list your admin users
7. is_admin test should return true for admin users
8. Orphaned records should be 0
9. Daily counts should return valid numbers

TROUBLESHOOTING:

If SALAM/MOBILY CUSTOMERS COUNT = 0:
  - You need to add customer data to the database
  - Or your RLS policies are too restrictive

If ADMIN USERS = 0:
  - Update a user's role: UPDATE profiles SET role = 'admin', status = 'active' WHERE email = 'your-email';

If RLS is DISABLED:
  - Run: ALTER TABLE salam_customers ENABLE ROW LEVEL SECURITY;
  - Run: ALTER TABLE mobily_customers ENABLE ROW LEVEL SECURITY;

If POLICIES COUNT < 7:
  - Run the fix_admin_access.sql migration

If ORPHANED RECORDS > 0:
  - Some customer records have invalid user_id
  - Update them: UPDATE salam_customers SET user_id = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1) WHERE user_id NOT IN (SELECT id FROM profiles);
*/
