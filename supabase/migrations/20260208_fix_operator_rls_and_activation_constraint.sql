-- ============================================
-- Fix Operator RLS Policies + activation_status constraint
-- ============================================
-- Problem: Operators could only see entries where operator_id = their ID.
-- New entries have operator_id = NULL, so operators saw empty tables.
-- Fix: Allow operators to see ALL entries with activation_status IN ('activating', 'activated')
-- and update entries where they are assigned OR entries not yet assigned.
-- Also: Add 'confirmed' to activation_status CHECK constraint for admin archive.
-- Note: operator_id is TEXT (not UUID), so auth.uid() must be cast to TEXT.
-- ============================================

-- ============================================
-- 1. Update activation_status CHECK constraint to include 'confirmed'
-- ============================================

-- Salam customers: drop old constraint and add new one with 'confirmed'
ALTER TABLE public.salam_customers
    DROP CONSTRAINT IF EXISTS salam_customers_activation_status_check;
ALTER TABLE public.salam_customers
    ADD CONSTRAINT salam_customers_activation_status_check
    CHECK (activation_status IN ('activated', 'activating', 'confirmed'));

-- Mobily customers: drop old constraint and add new one with 'confirmed'
ALTER TABLE public.mobily_customers
    DROP CONSTRAINT IF EXISTS mobily_customers_activation_status_check;
ALTER TABLE public.mobily_customers
    ADD CONSTRAINT mobily_customers_activation_status_check
    CHECK (activation_status IN ('activated', 'activating', 'confirmed'));

-- ============================================
-- 2. Drop old operator RLS policies
-- ============================================

DROP POLICY IF EXISTS "Operators can view assigned salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Operators can update assigned salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Operators can view assigned mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Operators can update assigned mobily customers" ON public.mobily_customers;

-- Also drop the new policies in case this migration is re-run
DROP POLICY IF EXISTS "Operators can view all active salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Operators can update claimable salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Operators can view all active mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Operators can update claimable mobily customers" ON public.mobily_customers;

-- ============================================
-- 3. Create new operator RLS policies
-- operator_id is TEXT, so we cast auth.uid() to TEXT
-- ============================================

-- SALAM CUSTOMERS --

-- Operators can view all salam entries with activating or activated status
CREATE POLICY "Operators can view all active salam customers"
    ON public.salam_customers FOR SELECT
    USING (
        public.is_operator(auth.uid())
        AND activation_status IN ('activating', 'activated')
    );

-- Operators can update entries assigned to them OR unassigned entries (operator_id IS NULL)
CREATE POLICY "Operators can update claimable salam customers"
    ON public.salam_customers FOR UPDATE
    USING (
        public.is_operator(auth.uid())
        AND (operator_id = auth.uid()::text OR operator_id IS NULL)
        AND activation_status IN ('activating', 'activated')
    );

-- MOBILY CUSTOMERS --

-- Operators can view all mobily entries with activating or activated status
CREATE POLICY "Operators can view all active mobily customers"
    ON public.mobily_customers FOR SELECT
    USING (
        public.is_operator(auth.uid())
        AND activation_status IN ('activating', 'activated')
    );

-- Operators can update entries assigned to them OR unassigned entries (operator_id IS NULL)
CREATE POLICY "Operators can update claimable mobily customers"
    ON public.mobily_customers FOR UPDATE
    USING (
        public.is_operator(auth.uid())
        AND (operator_id = auth.uid()::text OR operator_id IS NULL)
        AND activation_status IN ('activating', 'activated')
    );
