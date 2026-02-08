-- ============================================
-- Fix Operator Permissions & RLS Policies
-- ============================================
-- Problem: Operators get errors when saving status changes.
-- Fixes:
-- 1. Grant EXECUTE on is_operator function to authenticated role
-- 2. Re-ensure activation_status CHECK constraint includes 'confirmed'
-- 3. Recreate operator RLS policies to allow proper claim+update flow
-- ============================================

-- ============================================
-- 1. Grant EXECUTE on is_operator function
-- (was missing - is_admin and is_super_admin had GRANT but is_operator did not)
-- ============================================
GRANT EXECUTE ON FUNCTION public.is_operator(UUID) TO authenticated;

-- ============================================
-- 2. Ensure activation_status CHECK constraint includes 'confirmed'
-- (idempotent: drop if exists, then recreate)
-- ============================================

ALTER TABLE public.salam_customers
    DROP CONSTRAINT IF EXISTS salam_customers_activation_status_check;
ALTER TABLE public.salam_customers
    ADD CONSTRAINT salam_customers_activation_status_check
    CHECK (activation_status IN ('activated', 'activating', 'confirmed'));

ALTER TABLE public.mobily_customers
    DROP CONSTRAINT IF EXISTS mobily_customers_activation_status_check;
ALTER TABLE public.mobily_customers
    ADD CONSTRAINT mobily_customers_activation_status_check
    CHECK (activation_status IN ('activated', 'activating', 'confirmed'));

-- ============================================
-- 3. Recreate operator RLS policies
-- Drop existing operator policies first (idempotent)
-- ============================================

DROP POLICY IF EXISTS "Operators can view all active salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Operators can update claimable salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Operators can view all active mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Operators can update claimable mobily customers" ON public.mobily_customers;

-- Also drop old policy names in case they still exist
DROP POLICY IF EXISTS "Operators can view assigned salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Operators can update assigned salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Operators can view assigned mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Operators can update assigned mobily customers" ON public.mobily_customers;

-- ============================================
-- SALAM CUSTOMERS - Operator policies
-- ============================================

-- Operators can view all salam entries with activating or activated status
CREATE POLICY "Operators can view all active salam customers"
    ON public.salam_customers FOR SELECT
    USING (
        public.is_operator(auth.uid())
        AND activation_status IN ('activating', 'activated')
    );

-- Operators can update entries assigned to them OR unassigned entries
-- USING: old row must be activating/activated and either assigned to this operator or unassigned
-- WITH CHECK: new row must have operator_id = this operator, and valid activation_status
CREATE POLICY "Operators can update claimable salam customers"
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

-- ============================================
-- MOBILY CUSTOMERS - Operator policies
-- ============================================

-- Operators can view all mobily entries with activating or activated status
CREATE POLICY "Operators can view all active mobily customers"
    ON public.mobily_customers FOR SELECT
    USING (
        public.is_operator(auth.uid())
        AND activation_status IN ('activating', 'activated')
    );

-- Operators can update entries assigned to them OR unassigned entries
CREATE POLICY "Operators can update claimable mobily customers"
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
