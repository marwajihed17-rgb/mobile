-- ============================================
-- SUPABASE DASHBOARD INTEGRATION - COMPLETE SETUP
-- ============================================
-- This migration ensures all components from the documentation are in place
-- Run this in your Supabase SQL Editor to set up the complete dashboard integration
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 1: ENSURE PROFILES TABLE HAS REQUIRED FIELDS
-- ============================================

-- Add username column if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='username') THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT;
    END IF;
END $$;

-- Add supervisor_name column if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='supervisor_name') THEN
        ALTER TABLE public.profiles ADD COLUMN supervisor_name TEXT;
    END IF;
END $$;

-- Make username NOT NULL and UNIQUE (after ensuring all existing users have usernames)
UPDATE public.profiles SET username = email WHERE username IS NULL;
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;

-- Add unique constraint if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='profiles_username_key') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
    END IF;
END $$;

-- ============================================
-- STEP 2: ENSURE CUSTOMER TABLES HAVE CREATED_BY_USERNAME
-- ============================================

-- Add created_by_username to salam_customers if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='salam_customers' AND column_name='created_by_username') THEN
        ALTER TABLE public.salam_customers ADD COLUMN created_by_username TEXT;
    END IF;
END $$;

-- Add created_by_username to mobily_customers if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='mobily_customers' AND column_name='created_by_username') THEN
        ALTER TABLE public.mobily_customers ADD COLUMN created_by_username TEXT;
    END IF;
END $$;

-- ============================================
-- STEP 3: CREATE/UPDATE STATISTICS VIEWS
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
-- STEP 4: CREATE/UPDATE STATISTICS FUNCTIONS
-- ============================================

-- Function to get today's Salam customer count
CREATE OR REPLACE FUNCTION public.get_salam_daily_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
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
        SELECT COUNT(*)::INTEGER
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

-- Function to check if Salam customer exists by identity number
CREATE OR REPLACE FUNCTION public.check_salam_customer_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.salam_customers
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if Mobily customer exists by identity number
CREATE OR REPLACE FUNCTION public.check_mobily_customer_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mobily_customers
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if Salam SIM number exists
CREATE OR REPLACE FUNCTION public.check_salam_sim_exists(p_sim_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.salam_customers
        WHERE sim_number = p_sim_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if Mobily SIM number exists
CREATE OR REPLACE FUNCTION public.check_mobily_sim_exists(p_sim_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mobily_customers
        WHERE sim_number = p_sim_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: GRANT PERMISSIONS
-- ============================================

-- Grant permissions on views to authenticated users
GRANT SELECT ON public.salam_daily_stats TO authenticated;
GRANT SELECT ON public.mobily_daily_stats TO authenticated;
GRANT SELECT ON public.daily_stats_summary TO authenticated;

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_salam_daily_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_mobily_daily_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_stats_by_date_range(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_salam_customer_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_mobily_customer_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_salam_sim_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_mobily_sim_exists(TEXT) TO authenticated;

-- ============================================
-- STEP 6: VERIFY RLS POLICIES
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salam_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobily_customers ENABLE ROW LEVEL SECURITY;

-- Verify admin function exists for RLS policies
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

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify the setup:
-- SELECT * FROM public.salam_daily_stats LIMIT 5;
-- SELECT * FROM public.mobily_daily_stats LIMIT 5;
-- SELECT * FROM public.daily_stats_summary LIMIT 5;
-- SELECT public.get_salam_daily_count();
-- SELECT public.get_mobily_daily_count();
-- SELECT * FROM public.get_stats_by_date_range(CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE);

-- ============================================
-- COMPLETE!
-- ============================================
-- The Supabase dashboard integration is now complete.
-- You can now use the admin dashboard to:
-- 1. View total Salam and Mobily customers
-- 2. View daily statistics for both projects
-- 3. Manage users with username and supervisor_name
-- 4. Create and manage customers with creator tracking
-- ============================================
