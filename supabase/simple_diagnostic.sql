-- ============================================
-- SIMPLE CUSTOMER VISIBILITY DIAGNOSTIC
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
        THEN 'OK - Should see customers'
        WHEN role IN ('admin', 'super_admin') AND status != 'active'
        THEN 'ERROR - Admin but inactive'
        ELSE 'ERROR - NOT ADMIN role'
    END as diagnosis
FROM public.profiles
WHERE email LIKE '%admin%'
   OR role IN ('admin', 'super_admin')
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check if customers exist
SELECT
    'CUSTOMER COUNT' as check_type,
    (SELECT COUNT(*) FROM public.salam_customers) as salam_total,
    (SELECT COUNT(*) FROM public.mobily_customers) as mobily_total,
    (SELECT COUNT(*) FROM public.salam_customers WHERE DATE(created_at) = CURRENT_DATE) as salam_today,
    (SELECT COUNT(*) FROM public.mobily_customers WHERE DATE(created_at) = CURRENT_DATE) as mobily_today;

-- 3. Test is_admin function
SELECT
    'IS_ADMIN TEST' as check_type,
    p.email,
    p.role,
    p.status,
    public.is_admin(p.id) as function_result
FROM public.profiles p
WHERE p.role IN ('admin', 'super_admin')
   OR p.email LIKE '%admin%'
ORDER BY p.created_at DESC;

-- 4. Show recent customers
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
