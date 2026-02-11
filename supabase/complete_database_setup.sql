-- ============================================
-- SUPABASE COMPLETE DATABASE SETUP
-- PAA Solutions - Mobile Application
-- ============================================
-- This script creates the complete database schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================
-- CUSTOM TYPES (ENUMS)
-- ============================================

-- User role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin', 'operator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User status enum
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Activation status enum
DO $$ BEGIN
    CREATE TYPE activation_status AS ENUM ('activated', 'activating', 'confirmed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Project type enum
DO $$ BEGIN
    CREATE TYPE project_type AS ENUM ('salam', 'mobily');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Calendar type enum
DO $$ BEGIN
    CREATE TYPE calendar_type AS ENUM ('gregorian', 'hijri');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Module type enum (for future use)
DO $$ BEGIN
    CREATE TYPE module_type AS ENUM ('invoice', 'kdr', 'ga', 'kdr_inv', 'kdr_sellout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    username TEXT NOT NULL UNIQUE,
    supervisor_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    status user_status DEFAULT 'active' NOT NULL,
    operator_id TEXT, -- For users: which operator is assigned to them
    activation_status activation_status, -- For users: their activation status
    created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    dashboard_access BOOLEAN DEFAULT true NOT NULL,
    admin_privileges BOOLEAN DEFAULT false NOT NULL,
    notifications_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Module access table
CREATE TABLE IF NOT EXISTS public.module_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_type module_type NOT NULL,
    has_access BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, module_type)
);

-- Operators table (separate from profiles for better organization)
CREATE TABLE IF NOT EXISTS public.operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT UNIQUE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- PROJECT TABLES
-- ============================================

-- Salam Customers Table
CREATE TABLE IF NOT EXISTS public.salam_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by_username TEXT,

    -- Salam-specific fields (8 fields)
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL UNIQUE,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,
    package TEXT, -- الباقة

    -- Operator assignment fields
    operator_id TEXT, -- المشغل - assigned operator (can be TEXT or UUID based on your needs)
    operator_name TEXT, -- المشغل name for display
    activation_status activation_status, -- حالة التفعيل

    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT salam_customers_identity_unique UNIQUE (identity_number)
);

-- Mobily Customers Table
CREATE TABLE IF NOT EXISTS public.mobily_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by_username TEXT,

    -- Common fields
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL UNIQUE,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,

    -- Mobily-specific additional fields (7 more fields)
    birth_date TEXT NOT NULL,
    birth_date_calendar_type calendar_type DEFAULT 'gregorian' NOT NULL,
    identity_expiry_date TEXT NOT NULL,
    identity_expiry_date_calendar_type calendar_type DEFAULT 'gregorian' NOT NULL,
    package TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    price DECIMAL(10, 2), -- السعر

    -- Operator assignment fields
    operator_id TEXT, -- المشغل - assigned operator
    operator_name TEXT, -- المشغل name for display
    activation_status activation_status, -- حالة التفعيل

    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT mobily_customers_identity_unique UNIQUE (identity_number)
);

-- Legacy tables for backward compatibility
CREATE TABLE IF NOT EXISTS public.salam_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(identity_number)
);

CREATE TABLE IF NOT EXISTS public.mobily_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    identity_expiry_date TEXT NOT NULL,
    package TEXT NOT NULL,
    email TEXT NOT NULL,
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    register_number TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(identity_number)
);

-- Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code project_type NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Daily Customer Totals Table (for statistics)
CREATE TABLE IF NOT EXISTS public.daily_customer_totals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    project project_type NOT NULL,
    total_customers INTEGER NOT NULL DEFAULT 0,
    unique_users INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT daily_totals_date_project_unique UNIQUE (date, project)
);

-- Stats Daily Baseline Table (for daily reset at 00:30)
CREATE TABLE IF NOT EXISTS public.stats_daily_baseline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    project project_type NOT NULL,
    baseline_total INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT stats_baseline_date_project_unique UNIQUE (date, project)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_operator_id ON public.profiles(operator_id);

-- Salam customers indexes
CREATE INDEX IF NOT EXISTS idx_salam_customers_user_id ON public.salam_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_salam_customers_identity_number ON public.salam_customers(identity_number);
CREATE INDEX IF NOT EXISTS idx_salam_customers_sim_number ON public.salam_customers(sim_number);
CREATE INDEX IF NOT EXISTS idx_salam_customers_operator_id ON public.salam_customers(operator_id);
CREATE INDEX IF NOT EXISTS idx_salam_customers_activation_status ON public.salam_customers(activation_status);
CREATE INDEX IF NOT EXISTS idx_salam_customers_created_at ON public.salam_customers(created_at DESC);

-- Mobily customers indexes
CREATE INDEX IF NOT EXISTS idx_mobily_customers_user_id ON public.mobily_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_mobily_customers_identity_number ON public.mobily_customers(identity_number);
CREATE INDEX IF NOT EXISTS idx_mobily_customers_sim_number ON public.mobily_customers(sim_number);
CREATE INDEX IF NOT EXISTS idx_mobily_customers_operator_id ON public.mobily_customers(operator_id);
CREATE INDEX IF NOT EXISTS idx_mobily_customers_activation_status ON public.mobily_customers(activation_status);
CREATE INDEX IF NOT EXISTS idx_mobily_customers_created_at ON public.mobily_customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mobily_customers_birth_calendar ON public.mobily_customers(birth_date_calendar_type);
CREATE INDEX IF NOT EXISTS idx_mobily_customers_identity_expiry_calendar ON public.mobily_customers(identity_expiry_date_calendar_type);

-- Operators indexes
CREATE INDEX IF NOT EXISTS idx_operators_name ON public.operators(name);
CREATE INDEX IF NOT EXISTS idx_operators_is_active ON public.operators(is_active);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON public.projects(is_active);

-- Daily totals indexes
CREATE INDEX IF NOT EXISTS idx_daily_totals_date ON public.daily_customer_totals(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_totals_project ON public.daily_customer_totals(project);

-- Stats baseline indexes
CREATE INDEX IF NOT EXISTS idx_stats_baseline_date ON public.stats_daily_baseline(date DESC);
CREATE INDEX IF NOT EXISTS idx_stats_baseline_project ON public.stats_daily_baseline(project);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to check if a user is an admin
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

-- Function to check if a user is an operator
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

-- Function to check if a user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = check_user_id
        AND role = 'super_admin'
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        username,
        supervisor_name,
        role,
        created_by_id,
        created_by_username
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'supervisor_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role),
        (NEW.raw_user_meta_data->>'created_by_id')::UUID,
        NEW.raw_user_meta_data->>'created_by_username'
    );

    -- Create default user settings
    INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
    VALUES (NEW.id, true, false);

    -- Grant access to all modules by default
    INSERT INTO public.module_access (user_id, module_type, has_access)
    VALUES
        (NEW.id, 'invoice', true),
        (NEW.id, 'kdr', true),
        (NEW.id, 'ga', true),
        (NEW.id, 'kdr_inv', true),
        (NEW.id, 'kdr_sellout', true);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if Salam customer exists
CREATE OR REPLACE FUNCTION public.check_salam_customer_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.salam_customers
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if Mobily customer exists
CREATE OR REPLACE FUNCTION public.check_mobily_customer_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mobily_customers
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Function to get baseline total for a project
CREATE OR REPLACE FUNCTION public.get_stats_baseline(p_project project_type)
RETURNS INTEGER AS $$
DECLARE
    v_baseline INTEGER;
BEGIN
    SELECT baseline_total
    INTO v_baseline
    FROM public.stats_daily_baseline
    WHERE project = p_project
    ORDER BY date DESC
    LIMIT 1;

    RETURN COALESCE(v_baseline, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record daily baseline (run at 00:30 daily)
CREATE OR REPLACE FUNCTION public.record_daily_baseline()
RETURNS void AS $$
DECLARE
    v_yesterday DATE;
    v_today DATE;
    v_salam_total INTEGER;
    v_mobily_total INTEGER;
    v_salam_previous_baseline INTEGER;
    v_mobily_previous_baseline INTEGER;
BEGIN
    v_yesterday := CURRENT_DATE - INTERVAL '1 day';
    v_today := CURRENT_DATE;

    -- Get previous baseline
    SELECT COALESCE(baseline_total, 0) INTO v_salam_previous_baseline
    FROM public.stats_daily_baseline
    WHERE project = 'salam'
    ORDER BY date DESC
    LIMIT 1;

    SELECT COALESCE(baseline_total, 0) INTO v_mobily_previous_baseline
    FROM public.stats_daily_baseline
    WHERE project = 'mobily'
    ORDER BY date DESC
    LIMIT 1;

    -- Count yesterday's records
    SELECT COUNT(*)::INTEGER INTO v_salam_total
    FROM public.salam_customers
    WHERE DATE(created_at) = v_yesterday;

    SELECT COUNT(*)::INTEGER INTO v_mobily_total
    FROM public.mobily_customers
    WHERE DATE(created_at) = v_yesterday;

    -- Calculate new baseline
    v_salam_total := COALESCE(v_salam_previous_baseline, 0) + COALESCE(v_salam_total, 0);
    v_mobily_total := COALESCE(v_mobily_previous_baseline, 0) + COALESCE(v_mobily_total, 0);

    -- Insert or update baseline for today
    INSERT INTO public.stats_daily_baseline (date, project, baseline_total)
    VALUES (v_today, 'salam', v_salam_total)
    ON CONFLICT (date, project)
    DO UPDATE SET baseline_total = v_salam_total, updated_at = NOW();

    INSERT INTO public.stats_daily_baseline (date, project, baseline_total)
    VALUES (v_today, 'mobily', v_mobily_total)
    ON CONFLICT (date, project)
    DO UPDATE SET baseline_total = v_mobily_total, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get statistics by date range
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

-- Function to get recent Salam customers
CREATE OR REPLACE FUNCTION public.get_recent_salam_customers(p_limit INTEGER DEFAULT 10)
RETURNS SETOF public.salam_customers AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.salam_customers
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent Mobily customers
CREATE OR REPLACE FUNCTION public.get_recent_mobily_customers(p_limit INTEGER DEFAULT 10)
RETURNS SETOF public.mobily_customers AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.mobily_customers
    ORDER BY created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEWS
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
CREATE OR REPLACE VIEW public.daily_stats AS
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
-- TRIGGERS
-- ============================================

-- Auto-update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on salam_customers
DROP TRIGGER IF EXISTS update_salam_customers_updated_at ON public.salam_customers;
CREATE TRIGGER update_salam_customers_updated_at
    BEFORE UPDATE ON public.salam_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on mobily_customers
DROP TRIGGER IF EXISTS update_mobily_customers_updated_at ON public.mobily_customers;
CREATE TRIGGER update_mobily_customers_updated_at
    BEFORE UPDATE ON public.mobily_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on operators
DROP TRIGGER IF EXISTS update_operators_updated_at ON public.operators;
CREATE TRIGGER update_operators_updated_at
    BEFORE UPDATE ON public.operators
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at on projects
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Handle new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salam_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobily_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salam_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_customer_totals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stats_daily_baseline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "All users can view operator profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete users" ON public.profiles;
DROP POLICY IF EXISTS "System inserts profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "All users can view operator profiles"
    ON public.profiles FOR SELECT
    USING (role = 'operator' AND status = 'active');

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND (
            role = (SELECT role FROM public.profiles WHERE id = auth.uid())
            OR public.is_super_admin(auth.uid())
        )
    );

CREATE POLICY "Super admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can delete users"
    ON public.profiles FOR DELETE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "System inserts profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- USER SETTINGS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Admins can view all user settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Admins can update any user settings" ON public.user_settings;
DROP POLICY IF EXISTS "System inserts settings" ON public.user_settings;

CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user settings"
    ON public.user_settings FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND (
            admin_privileges = (SELECT admin_privileges FROM public.user_settings WHERE user_id = auth.uid())
            OR public.is_admin(auth.uid())
        )
    );

CREATE POLICY "Admins can update any user settings"
    ON public.user_settings FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "System inserts settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MODULE ACCESS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own module access" ON public.module_access;
DROP POLICY IF EXISTS "Admins can view all module access" ON public.module_access;
DROP POLICY IF EXISTS "Admins can manage module access" ON public.module_access;

CREATE POLICY "Users can view own module access"
    ON public.module_access FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all module access"
    ON public.module_access FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage module access"
    ON public.module_access FOR ALL
    USING (public.is_admin(auth.uid()));

-- ============================================
-- OPERATORS POLICIES
-- ============================================

DROP POLICY IF EXISTS "All users can view active operators" ON public.operators;
DROP POLICY IF EXISTS "Admins can manage operators" ON public.operators;

CREATE POLICY "All users can view active operators"
    ON public.operators FOR SELECT
    USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage operators"
    ON public.operators FOR ALL
    USING (public.is_admin(auth.uid()));

-- ============================================
-- SALAM CUSTOMERS POLICIES
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

CREATE POLICY "Users can insert own salam customers"
    ON public.salam_customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can delete own salam customers"
    ON public.salam_customers FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all salam customers"
    ON public.salam_customers FOR DELETE
    USING (public.is_admin(auth.uid()));

-- ============================================
-- MOBILY CUSTOMERS POLICIES
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

CREATE POLICY "Users can insert own mobily customers"
    ON public.mobily_customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

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

CREATE POLICY "Users can delete own mobily customers"
    ON public.mobily_customers FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all mobily customers"
    ON public.mobily_customers FOR DELETE
    USING (public.is_admin(auth.uid()));

-- ============================================
-- LEGACY TABLES POLICIES
-- ============================================

-- Salam entries policies
CREATE POLICY "Users can view salam entries"
    ON public.salam_entries FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert salam entries"
    ON public.salam_entries FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own salam entries"
    ON public.salam_entries FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own salam entries"
    ON public.salam_entries FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Mobily entries policies
CREATE POLICY "Users can view mobily entries"
    ON public.mobily_entries FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert mobily entries"
    ON public.mobily_entries FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own mobily entries"
    ON public.mobily_entries FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own mobily entries"
    ON public.mobily_entries FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============================================
-- OTHER TABLES POLICIES
-- ============================================

-- Projects policies
CREATE POLICY "All users can view projects"
    ON public.projects FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage projects"
    ON public.projects FOR ALL
    USING (public.is_admin(auth.uid()));

-- Daily totals policies
CREATE POLICY "All users can view daily totals"
    ON public.daily_customer_totals FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage daily totals"
    ON public.daily_customer_totals FOR ALL
    USING (true);

-- Stats baseline policies
CREATE POLICY "All users can view stats baseline"
    ON public.stats_daily_baseline FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can manage stats baseline"
    ON public.stats_daily_baseline FOR ALL
    USING (true);

-- Audit logs policies
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.salam_customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mobily_customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.operators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_customer_totals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stats_daily_baseline;

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default projects
INSERT INTO public.projects (name, code, description, is_active)
VALUES
    ('Salam', 'salam', 'Salam project for customer management', true),
    ('Mobily', 'mobily', 'Mobily project for customer management', true)
ON CONFLICT (code) DO NOTHING;

-- Insert default operators
INSERT INTO public.operators (name, code, is_active)
VALUES
    ('Operator 1', 'OP1', true),
    ('Operator 2', 'OP2', true),
    ('Operator 3', 'OP3', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

GRANT SELECT ON public.salam_daily_stats TO authenticated;
GRANT SELECT ON public.mobily_daily_stats TO authenticated;
GRANT SELECT ON public.daily_stats TO authenticated;

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Verify tables were created
SELECT
    'Tables created:' as status,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'profiles',
    'user_settings',
    'operators',
    'salam_customers',
    'mobily_customers',
    'projects',
    'daily_customer_totals',
    'stats_daily_baseline'
);

-- Verify functions were created
SELECT
    'Functions created:' as status,
    COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'is_admin',
    'is_operator',
    'is_super_admin',
    'get_salam_daily_count',
    'get_mobily_daily_count',
    'get_stats_baseline',
    'record_daily_baseline'
);

-- ============================================
-- NEXT STEPS
-- ============================================
/*
✅ Database setup complete!

Next steps:
1. Create your first admin user:
   - Go to Supabase Dashboard → Authentication → Users
   - Add a new user with email and password
   - Or use the SQL below to create an admin user

2. Update the user's role to super_admin:
   UPDATE public.profiles
   SET role = 'super_admin'
   WHERE email = 'your-admin@email.com';

3. Test the connection from your Next.js app

4. Optional: Set up the daily reset cron job:
   SELECT cron.schedule(
       'daily-baseline-reset',
       '30 0 * * *',  -- Run at 00:30 daily
       $$SELECT public.record_daily_baseline()$$
   );
*/
