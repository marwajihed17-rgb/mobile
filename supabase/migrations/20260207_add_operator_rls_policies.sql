-- ============================================
-- Add RLS policies for operators (مشغل)
-- Operators need to SELECT and UPDATE entries assigned to them (operator_id = auth.uid())
-- ============================================

-- Helper function: check if a user is an operator
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

-- ============================================
-- SALAM CUSTOMERS - Operator policies
-- ============================================

-- Operators can view entries assigned to them
CREATE POLICY "Operators can view assigned salam customers"
    ON public.salam_customers FOR SELECT
    USING (
        public.is_operator(auth.uid())
        AND operator_id = auth.uid()
    );

-- Operators can update entries assigned to them
CREATE POLICY "Operators can update assigned salam customers"
    ON public.salam_customers FOR UPDATE
    USING (
        public.is_operator(auth.uid())
        AND operator_id = auth.uid()
    );

-- ============================================
-- MOBILY CUSTOMERS - Operator policies
-- ============================================

-- Operators can view entries assigned to them
CREATE POLICY "Operators can view assigned mobily customers"
    ON public.mobily_customers FOR SELECT
    USING (
        public.is_operator(auth.uid())
        AND operator_id = auth.uid()
    );

-- Operators can update entries assigned to them
CREATE POLICY "Operators can update assigned mobily customers"
    ON public.mobily_customers FOR UPDATE
    USING (
        public.is_operator(auth.uid())
        AND operator_id = auth.uid()
    );
