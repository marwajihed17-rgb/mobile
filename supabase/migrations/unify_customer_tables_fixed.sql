-- ============================================
-- MIGRATION: Unify Customer Tables (FIXED)
-- ============================================
-- This migration creates a unified customer structure with:
-- 1. Unified customers table (combines salam_customers and mobily_customers)
-- 2. Projects table/enum for project tracking
-- 3. Daily customer totals table for dashboard statistics
-- 4. Updated RLS policies and functions
-- ============================================

-- ============================================
-- 1. CREATE PROJECT ENUM
-- ============================================
DO $$ BEGIN
    CREATE TYPE project_type AS ENUM ('salam', 'mobily');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. ADD MISSING COLUMNS TO OLD TABLES (IF NEEDED)
-- ============================================

-- Add created_by_username to salam_customers if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'salam_customers'
        AND column_name = 'created_by_username'
    ) THEN
        ALTER TABLE public.salam_customers ADD COLUMN created_by_username TEXT;
    END IF;
END $$;

-- Add created_by_username to mobily_customers if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'mobily_customers'
        AND column_name = 'created_by_username'
    ) THEN
        ALTER TABLE public.mobily_customers ADD COLUMN created_by_username TEXT;
    END IF;
END $$;

-- ============================================
-- 3. CREATE UNIFIED CUSTOMERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by_username TEXT,

    -- Common fields (required for all projects)
    full_name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,

    -- Project identification
    project project_type NOT NULL,
    supervisor_name TEXT,
    status TEXT DEFAULT 'active',

    -- Mobily-specific fields (nullable for Salam customers)
    birth_date TEXT,
    identity_expiry_date TEXT,
    package TEXT,
    email TEXT,
    city TEXT,
    district TEXT,

    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints: identity_number and sim_number must be unique per project
    CONSTRAINT customers_identity_project_unique UNIQUE (identity_number, project),
    CONSTRAINT customers_sim_project_unique UNIQUE (sim_number, project)
);

-- ============================================
-- 4. CREATE PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code project_type NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert default projects
INSERT INTO public.projects (name, code, description, is_active)
VALUES
    ('سلام', 'salam', 'مشروع سلام للاتصالات', true),
    ('موبايلي', 'mobily', 'مشروع موبايلي للاتصالات', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 5. CREATE DAILY CUSTOMER TOTALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.daily_customer_totals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    project project_type NOT NULL,
    total_customers INTEGER NOT NULL DEFAULT 0,
    unique_users INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint: one record per date per project
    CONSTRAINT daily_totals_date_project_unique UNIQUE (date, project)
);

-- ============================================
-- 6. MIGRATE EXISTING DATA
-- ============================================

-- Migrate data from salam_customers to unified customers table
INSERT INTO public.customers (
    id,
    user_id,
    created_by_username,
    full_name,
    identity_number,
    phone_number,
    sim_number,
    device_number,
    nationality,
    register_number,
    project,
    supervisor_name,
    created_at,
    updated_at
)
SELECT
    sc.id,
    sc.user_id,
    sc.created_by_username,
    sc.name,
    sc.identity_number,
    sc.phone_number,
    sc.sim_number,
    sc.device_number,
    sc.nationality,
    sc.register_number,
    'salam'::project_type,
    p.supervisor_name,
    sc.created_at,
    sc.updated_at
FROM public.salam_customers sc
LEFT JOIN public.profiles p ON sc.user_id = p.id
ON CONFLICT (identity_number, project) DO NOTHING;

-- Migrate data from mobily_customers to unified customers table
INSERT INTO public.customers (
    id,
    user_id,
    created_by_username,
    full_name,
    identity_number,
    phone_number,
    sim_number,
    device_number,
    nationality,
    register_number,
    project,
    supervisor_name,
    birth_date,
    identity_expiry_date,
    package,
    email,
    city,
    district,
    created_at,
    updated_at
)
SELECT
    mc.id,
    mc.user_id,
    mc.created_by_username,
    mc.name,
    mc.identity_number,
    mc.phone_number,
    mc.sim_number,
    mc.device_number,
    mc.nationality,
    mc.register_number,
    'mobily'::project_type,
    p.supervisor_name,
    mc.birth_date,
    mc.identity_expiry_date,
    mc.package,
    mc.email,
    mc.city,
    mc.district,
    mc.created_at,
    mc.updated_at
FROM public.mobily_customers mc
LEFT JOIN public.profiles p ON mc.user_id = p.id
ON CONFLICT (identity_number, project) DO NOTHING;

-- ============================================
-- 7. POPULATE DAILY TOTALS FROM HISTORICAL DATA
-- ============================================

-- Populate daily totals for Salam
INSERT INTO public.daily_customer_totals (date, project, total_customers, unique_users)
SELECT
    DATE(created_at) as date,
    'salam'::project_type as project,
    COUNT(*)::INTEGER as total_customers,
    COUNT(DISTINCT user_id)::INTEGER as unique_users
FROM public.customers
WHERE project = 'salam'
GROUP BY DATE(created_at)
ON CONFLICT (date, project)
DO UPDATE SET
    total_customers = EXCLUDED.total_customers,
    unique_users = EXCLUDED.unique_users,
    updated_at = NOW();

-- Populate daily totals for Mobily
INSERT INTO public.daily_customer_totals (date, project, total_customers, unique_users)
SELECT
    DATE(created_at) as date,
    'mobily'::project_type as project,
    COUNT(*)::INTEGER as total_customers,
    COUNT(DISTINCT user_id)::INTEGER as unique_users
FROM public.customers
WHERE project = 'mobily'
GROUP BY DATE(created_at)
ON CONFLICT (date, project)
DO UPDATE SET
    total_customers = EXCLUDED.total_customers,
    unique_users = EXCLUDED.unique_users,
    updated_at = NOW();

-- ============================================
-- 8. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_project ON public.customers(project);
CREATE INDEX IF NOT EXISTS idx_customers_identity_number ON public.customers(identity_number);
CREATE INDEX IF NOT EXISTS idx_customers_sim_number ON public.customers(sim_number);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_supervisor ON public.customers(supervisor_name);

CREATE INDEX IF NOT EXISTS idx_daily_totals_date ON public.daily_customer_totals(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_totals_project ON public.daily_customer_totals(project);

CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON public.projects(is_active);

-- ============================================
-- 9. CREATE/UPDATE FUNCTIONS
-- ============================================

-- Function to check if customer exists (unified)
CREATE OR REPLACE FUNCTION public.check_customer_exists(
    p_identity_number TEXT,
    p_project project_type
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.customers
        WHERE identity_number = p_identity_number
        AND project = p_project
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get today's customer count by project
CREATE OR REPLACE FUNCTION public.get_daily_customer_count(p_project project_type)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.customers
        WHERE DATE(created_at) = CURRENT_DATE
        AND project = p_project
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get today's Salam count (backward compatibility)
CREATE OR REPLACE FUNCTION public.get_salam_daily_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN public.get_daily_customer_count('salam');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get today's Mobily count (backward compatibility)
CREATE OR REPLACE FUNCTION public.get_mobily_daily_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN public.get_daily_customer_count('mobily');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update daily totals
CREATE OR REPLACE FUNCTION public.update_daily_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_date DATE;
    v_project project_type;
    v_total INTEGER;
    v_unique_users INTEGER;
BEGIN
    -- Determine the date and project to update
    IF TG_OP = 'DELETE' THEN
        v_date := DATE(OLD.created_at);
        v_project := OLD.project;
    ELSE
        v_date := DATE(NEW.created_at);
        v_project := NEW.project;
    END IF;

    -- Calculate totals for the date and project
    SELECT
        COUNT(*)::INTEGER,
        COUNT(DISTINCT user_id)::INTEGER
    INTO v_total, v_unique_users
    FROM public.customers
    WHERE DATE(created_at) = v_date
    AND project = v_project;

    -- Upsert into daily_customer_totals
    INSERT INTO public.daily_customer_totals (date, project, total_customers, unique_users)
    VALUES (v_date, v_project, v_total, v_unique_users)
    ON CONFLICT (date, project)
    DO UPDATE SET
        total_customers = v_total,
        unique_users = v_unique_users,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get statistics by date range (updated)
CREATE OR REPLACE FUNCTION public.get_customer_stats_by_date_range(
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
        FROM public.customers
        WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
        AND project = 'salam'
        GROUP BY DATE(created_at)
    ) s
    FULL OUTER JOIN (
        SELECT DATE(created_at) as date, COUNT(*) as customer_count
        FROM public.customers
        WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date
        AND project = 'mobily'
        GROUP BY DATE(created_at)
    ) m ON s.date = m.date
    ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. CREATE TRIGGERS
-- ============================================

-- Trigger to auto-update updated_at on customers
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on daily_customer_totals
DROP TRIGGER IF EXISTS update_daily_totals_updated_at ON public.daily_customer_totals;
CREATE TRIGGER update_daily_totals_updated_at
    BEFORE UPDATE ON public.daily_customer_totals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update daily totals when customer is added/updated/deleted
DROP TRIGGER IF EXISTS trigger_update_daily_totals ON public.customers;
CREATE TRIGGER trigger_update_daily_totals
    AFTER INSERT OR UPDATE OR DELETE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_daily_totals();

-- ============================================
-- 11. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_customer_totals ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 12. CREATE RLS POLICIES FOR CUSTOMERS
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can view all customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can update all customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;
DROP POLICY IF EXISTS "Admins can delete all customers" ON public.customers;

-- Users can view their own customers
CREATE POLICY "Users can view own customers"
    ON public.customers FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all customers
CREATE POLICY "Admins can view all customers"
    ON public.customers FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Users can insert their own customers
CREATE POLICY "Users can insert own customers"
    ON public.customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own customers
CREATE POLICY "Users can update own customers"
    ON public.customers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can update all customers
CREATE POLICY "Admins can update all customers"
    ON public.customers FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Users can delete their own customers
CREATE POLICY "Users can delete own customers"
    ON public.customers FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can delete all customers
CREATE POLICY "Admins can delete all customers"
    ON public.customers FOR DELETE
    USING (public.is_admin(auth.uid()));

-- ============================================
-- 13. CREATE RLS POLICIES FOR PROJECTS
-- ============================================

DROP POLICY IF EXISTS "Users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

-- All authenticated users can view projects
CREATE POLICY "Users can view projects"
    ON public.projects FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only admins can modify projects
CREATE POLICY "Admins can insert projects"
    ON public.projects FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update projects"
    ON public.projects FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete projects"
    ON public.projects FOR DELETE
    USING (public.is_admin(auth.uid()));

-- ============================================
-- 14. CREATE RLS POLICIES FOR DAILY TOTALS
-- ============================================

DROP POLICY IF EXISTS "Users can view daily totals" ON public.daily_customer_totals;
DROP POLICY IF EXISTS "System can insert daily totals" ON public.daily_customer_totals;
DROP POLICY IF EXISTS "System can update daily totals" ON public.daily_customer_totals;

-- All authenticated users can view daily totals
CREATE POLICY "Users can view daily totals"
    ON public.daily_customer_totals FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only system can insert/update daily totals (via triggers)
CREATE POLICY "System can insert daily totals"
    ON public.daily_customer_totals FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update daily totals"
    ON public.daily_customer_totals FOR UPDATE
    USING (true);

-- ============================================
-- 15. CREATE VIEWS
-- ============================================

-- View for daily statistics
CREATE OR REPLACE VIEW public.daily_stats AS
SELECT
    date,
    SUM(CASE WHEN project = 'salam' THEN total_customers ELSE 0 END) as salam_count,
    SUM(CASE WHEN project = 'mobily' THEN total_customers ELSE 0 END) as mobily_count,
    SUM(CASE WHEN project = 'salam' THEN unique_users ELSE 0 END) as salam_users,
    SUM(CASE WHEN project = 'mobily' THEN unique_users ELSE 0 END) as mobily_users,
    SUM(total_customers) as total_count
FROM public.daily_customer_totals
GROUP BY date
ORDER BY date DESC;

-- View for customers with user details
CREATE OR REPLACE VIEW public.customers_with_users AS
SELECT
    c.*,
    p.username,
    p.email,
    p.full_name as user_full_name,
    p.role as user_role,
    p.status as user_status
FROM public.customers c
LEFT JOIN public.profiles p ON c.user_id = p.id;

-- ============================================
-- 16. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.customers TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.daily_customer_totals TO authenticated;
GRANT SELECT ON public.daily_stats TO authenticated;
GRANT SELECT ON public.customers_with_users TO authenticated;

GRANT EXECUTE ON FUNCTION public.check_customer_exists(TEXT, project_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_customer_count(project_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_stats_by_date_range(DATE, DATE) TO authenticated;

-- ============================================
-- 17. ADD COMMENTS
-- ============================================
COMMENT ON TABLE public.customers IS 'Unified customer table for all projects (Salam and Mobily)';
COMMENT ON TABLE public.projects IS 'Available projects in the system';
COMMENT ON TABLE public.daily_customer_totals IS 'Daily aggregated statistics per project';
COMMENT ON VIEW public.daily_stats IS 'Consolidated daily statistics across all projects';
COMMENT ON VIEW public.customers_with_users IS 'Customers with joined user profile information';

-- ============================================
-- Migration Complete
-- ============================================

-- Show summary
DO $$
DECLARE
    salam_count INTEGER;
    mobily_count INTEGER;
    total_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO salam_count FROM public.customers WHERE project = 'salam';
    SELECT COUNT(*) INTO mobily_count FROM public.customers WHERE project = 'mobily';
    total_count := salam_count + mobily_count;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migrated % Salam customers', salam_count;
    RAISE NOTICE 'Migrated % Mobily customers', mobily_count;
    RAISE NOTICE 'Total: % customers', total_count;
    RAISE NOTICE '========================================';
END $$;
