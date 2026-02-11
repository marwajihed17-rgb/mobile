-- ============================================
-- SIMPLE CUSTOMER VISIBILITY DIAGNOSTIC
-- ============================================
-- Quick diagnostic to find why customers are not visible
-- ============================================

-- 1. Check your admin user
SELECT
    'YOUR ADMIN USER' as check_type,
    email,
    username,
    role,
    status,
    CASE
        WHEN role IN ('admin', 'super_admin') AND status = 'active'
        THEN '✅ Should see customers'
        WHEN role IN ('admin', 'super_admin') AND status != 'active'
        THEN '❌ Admin but inactive'
        ELSE '❌ NOT ADMIN - Need to upgrade role'
    END as diagnosis
FROM public.profiles
WHERE email LIKE '%admin%'  -- Shows users with 'admin' in email
   OR role IN ('admin', 'super_admin')  -- Or users with admin role
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check if customers exist
SELECT
    'CUSTOMER COUNT' as check_type,
    (SELECT COUNT(*) FROM public.salam_customers) as salam_total,
    (SELECT COUNT(*) FROM public.mobily_customers) as mobily_total,
    (SELECT COUNT(*) FROM public.salam_customers WHERE DATE(created_at) = CURRENT_DATE) as salam_today,
    (SELECT COUNT(*) FROM public.mobily_customers WHERE DATE(created_at) = CURRENT_DATE) as mobily_today;

-- 3. Test is_admin function for each admin user
SELECT
    'IS_ADMIN TEST' as check_type,
    p.email,
    p.role,
    p.status,
    public.is_admin(p.id) as function_returns,
    CASE
        WHEN public.is_admin(p.id) = true THEN '✅ FUNCTION WORKS'
        WHEN public.is_admin(p.id) = false THEN '❌ FUNCTION RETURNS FALSE'
        ELSE '❌ FUNCTION RETURNS NULL'
    END as result
FROM public.profiles p
WHERE p.role IN ('admin', 'super_admin')
   OR p.email LIKE '%admin%'
ORDER BY p.created_at DESC;

-- 4. Show recent customers (this bypasses RLS if run as superuser)
SELECT
    'RECENT CUSTOMERS' as check_type,
    sc.name,
    sc.phone_number,
    sc.user_id,
    p.email as created_by_email,
    p.role as created_by_role,
    sc.created_at
FROM public.salam_customers sc
LEFT JOIN public.profiles p ON sc.user_id = p.id
ORDER BY sc.created_at DESC
LIMIT 5;

-- ============================================
-- WHAT TO DO BASED ON RESULTS
-- ============================================

SELECT '
📋 HOW TO READ THE RESULTS:

1. YOUR ADMIN USER:
   - If diagnosis shows "❌ NOT ADMIN" → Run the fix below
   - If diagnosis shows "❌ Admin but inactive" → User is disabled
   - If diagnosis shows "✅ Should see customers" → Check next step

2. CUSTOMER COUNT:
   - If salam_total or mobily_total > 0 → Customers exist
   - If both are 0 → No customers created yet (that''s OK)

3. IS_ADMIN TEST:
   - If result is "✅ FUNCTION WORKS" → Function is good, check step 4
   - If result is "❌ FUNCTION RETURNS FALSE" → User role is wrong
   - If result is "❌ FUNCTION RETURNS NULL" → User doesn''t exist or status wrong

4. RECENT CUSTOMERS:
   - If you see customer names → Customers exist in database
   - Check the created_by_role column
   - If it shows "user" instead of "admin" → That''s the issue!

═══════════════════════════════════════════════════════════════

🔧 QUICK FIX:

If your user has role = "user" instead of "admin", run this:

UPDATE public.profiles
SET role = ''super_admin'', status = ''active''
WHERE email = ''YOUR_EMAIL_HERE'';

Replace YOUR_EMAIL_HERE with your actual email address.

═══════════════════════════════════════════════════════════════

' as guide;
