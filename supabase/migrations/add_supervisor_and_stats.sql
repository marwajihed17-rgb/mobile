-- ============================================
-- MIGRATION: Add supervisor_name and daily stats views
-- ============================================

-- Add supervisor_name column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS supervisor_name TEXT;

-- Add unique constraint on SIM numbers if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'salam_customers_sim_unique'
    ) THEN
        ALTER TABLE public.salam_customers
        ADD CONSTRAINT salam_customers_sim_unique UNIQUE (sim_number);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'mobily_customers_sim_unique'
    ) THEN
        ALTER TABLE public.mobily_customers
        ADD CONSTRAINT mobily_customers_sim_unique UNIQUE (sim_number);
    END IF;
END $$;

-- ============================================
-- DAILY STATISTICS VIEWS
-- ============================================

-- View for Salam daily statistics
CREATE OR REPLACE VIEW public.salam_daily_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as customer_count,
    COUNT(DISTINCT user_id) as unique_users
FROM public.salam_customers
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View for Mobily daily statistics
CREATE OR REPLACE VIEW public.mobily_daily_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as customer_count,
    COUNT(DISTINCT user_id) as unique_users
FROM public.mobily_customers
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Combined daily statistics view
CREATE OR REPLACE VIEW public.daily_stats_summary AS
SELECT
    COALESCE(s.date, m.date) as date,
    COALESCE(s.customer_count, 0) as salam_count,
    COALESCE(m.customer_count, 0) as mobily_count,
    COALESCE(s.unique_users, 0) as salam_users,
    COALESCE(m.unique_users, 0) as mobily_users,
    COALESCE(s.customer_count, 0) + COALESCE(m.customer_count, 0) as total_count
FROM public.salam_daily_stats s
FULL OUTER JOIN public.mobily_daily_stats m ON s.date = m.date
ORDER BY date DESC;

-- ============================================
-- FUNCTIONS FOR DAILY STATISTICS
-- ============================================

-- Function to get today's Salam customer count
CREATE OR REPLACE FUNCTION public.get_salam_daily_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.salam_customers
        WHERE DATE(created_at) = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get today's Mobily customer count
CREATE OR REPLACE FUNCTION public.get_mobily_daily_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.mobily_customers
        WHERE DATE(created_at) = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get statistics for a specific date range
CREATE OR REPLACE FUNCTION public.get_stats_by_date_range(
    p_start_date DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    date DATE,
    salam_count BIGINT,
    mobily_count BIGINT,
    total_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(s.date, m.date) as date,
        COALESCE(s.customer_count, 0) as salam_count,
        COALESCE(m.customer_count, 0) as mobily_count,
        COALESCE(s.customer_count, 0) + COALESCE(m.customer_count, 0) as total_count
    FROM (
        SELECT DATE(created_at) as date, COUNT(*) as customer_count
        FROM public.salam_customers
        WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(created_at)
    ) s
    FULL OUTER JOIN (
        SELECT DATE(created_at) as date, COUNT(*) as customer_count
        FROM public.mobily_customers
        WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(created_at)
    ) m ON s.date = m.date
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS ON VIEWS
-- ============================================

GRANT SELECT ON public.salam_daily_stats TO authenticated;
GRANT SELECT ON public.mobily_daily_stats TO authenticated;
GRANT SELECT ON public.daily_stats_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_salam_daily_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mobily_daily_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stats_by_date_range(DATE, DATE) TO authenticated;
