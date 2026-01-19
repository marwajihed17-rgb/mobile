-- ============================================
-- Add Total Count Functions
-- ============================================
-- These functions bypass RLS to show total counts for all users
-- Created: 2026-01-19
-- ============================================

-- Function to get total Salam customer count
CREATE OR REPLACE FUNCTION public.get_salam_total_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.salam_customers
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total Mobily customer count
CREATE OR REPLACE FUNCTION public.get_mobily_total_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.mobily_customers
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_salam_total_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mobily_total_count() TO authenticated;
