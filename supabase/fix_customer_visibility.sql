-- ============================================
-- FIX CUSTOMER VISIBILITY ISSUE
-- ============================================
-- Run this after running diagnose_customer_visibility.sql
-- This fixes common RLS issues preventing admins from seeing customer data
-- ============================================

-- STEP 1: Ensure is_admin function exists and works correctly
-- ============================================

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

-- STEP 2: Ensure is_operator function exists
-- ============================================

CREATE OR REPLACE FUNCTION public.is_operator(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = check_user_id
        AND role = 'operator'
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Recreate RLS policies for Salam Customers
-- ============================================

DROP POLICY IF EXISTS "Users can view own salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Admins can view all salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Operators can view assigned salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Users can insert own salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Users can update own salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Admins can update all salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Operators can update assigned salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Users can delete own salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Admins can delete all salam customers" ON public.salam_customers;

-- SELECT policies
CREATE POLICY "Users can view own salam customers"
    ON public.salam_customers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all salam customers"
    ON public.salam_customers FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Operators can view assigned salam customers"
    ON public.salam_customers FOR SELECT
    USING (
        public.is_operator(auth.uid())
        AND activation_status IN ('activating', 'activated')
    );

-- INSERT policies
CREATE POLICY "Users can insert own salam customers"
    ON public.salam_customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE policies
CREATE POLICY "Users can update own salam customers"
    ON public.salam_customers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all salam customers"
    ON public.salam_customers FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Operators can update assigned salam customers"
    ON public.salam_customers FOR UPDATE
    USING (
        public.is_operator(auth.uid())
        AND (operator_id = auth.uid()::text OR operator_id IS NULL)
        AND activation_status IN ('activating', 'activated')
    )
    WITH CHECK (
        public.is_operator(auth.uid())
        AND operator_id = auth.uid()::text
        AND activation_status IN ('activating', 'activated', 'confirmed')
    );

-- DELETE policies
CREATE POLICY "Users can delete own salam customers"
    ON public.salam_customers FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all salam customers"
    ON public.salam_customers FOR DELETE
    USING (public.is_admin(auth.uid()));

-- STEP 4: Recreate RLS policies for Mobily Customers
-- ============================================

DROP POLICY IF EXISTS "Users can view own mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Admins can view all mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Operators can view assigned mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Users can insert own mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Users can update own mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Admins can update all mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Operators can update assigned mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Users can delete own mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Admins can delete all mobily customers" ON public.mobily_customers;

-- SELECT policies
CREATE POLICY "Users can view own mobily customers"
    ON public.mobily_customers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mobily customers"
    ON public.mobily_customers FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Operators can view assigned mobily customers"
    ON public.mobily_customers FOR SELECT
    USING (
        public.is_operator(auth.uid())
        AND activation_status IN ('activating', 'activated')
    );

-- INSERT policies
CREATE POLICY "Users can insert own mobily customers"
    ON public.mobily_customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- UPDATE policies
CREATE POLICY "Users can update own mobily customers"
    ON public.mobily_customers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all mobily customers"
    ON public.mobily_customers FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Operators can update assigned mobily customers"
    ON public.mobily_customers FOR UPDATE
    USING (
        public.is_operator(auth.uid())
        AND (operator_id = auth.uid()::text OR operator_id IS NULL)
        AND activation_status IN ('activating', 'activated')
    )
    WITH CHECK (
        public.is_operator(auth.uid())
        AND operator_id = auth.uid()::text
        AND activation_status IN ('activating', 'activated', 'confirmed')
    );

-- DELETE policies
CREATE POLICY "Users can delete own mobily customers"
    ON public.mobily_customers FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all mobily customers"
    ON public.mobily_customers FOR DELETE
    USING (public.is_admin(auth.uid()));

-- ============================================
-- VERIFICATION
-- ============================================

-- Test is_admin function
SELECT '=== Testing is_admin Function ===' as step;
SELECT
    p.email,
    p.role,
    public.is_admin(p.id) as is_admin_result
FROM public.profiles p
WHERE p.role IN ('admin', 'super_admin')
LIMIT 5;

-- Show RLS policies
SELECT '=== RLS Policies Created ===' as step;
SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('salam_customers', 'mobily_customers')
ORDER BY tablename, cmd, policyname;

-- Count customers
SELECT '=== Customer Counts ===' as step;
SELECT
    'Salam' as project,
    COUNT(*) as total_customers
FROM public.salam_customers
UNION ALL
SELECT
    'Mobily' as project,
    COUNT(*) as total_customers
FROM public.mobily_customers;

SELECT '
✅ RLS POLICIES FIXED

What was fixed:
1. ✅ Created/updated is_admin() function
2. ✅ Created/updated is_operator() function
3. ✅ Recreated all RLS policies for salam_customers
4. ✅ Recreated all RLS policies for mobily_customers

Next steps:
1. Verify your user has admin role:
   SELECT email, role, status FROM public.profiles WHERE email = ''your@email.com'';

2. If role is not admin, upgrade it:
   UPDATE public.profiles SET role = ''super_admin'', status = ''active''
   WHERE email = ''your@email.com'';

3. Refresh your browser and try accessing admin dashboard again

4. If still not working, check browser console for errors

Expected behavior:
✅ Admin users can see ALL customers (regardless of user_id)
✅ Regular users can only see their own customers
✅ Operators can see customers with activation_status IN (''activating'', ''activated'')
' as success_message;
