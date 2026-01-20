-- ============================================
-- PAA SOLUTIONS - COMPLETE DATABASE REBUILD WITH AUTHENTICATION
-- ============================================
-- PRODUCTION-READY SCHEMA WITH USER AUTHENTICATION
-- Version: 3.0 (Authentication Ready)
-- Created: 2026-01-20
--
-- This script rebuilds the entire database including:
-- ✅ Core tables (profiles, customers, projects, audit_logs)
-- ✅ Row Level Security (RLS) policies
-- ✅ Database functions and triggers
-- ✅ Storage buckets and policies
-- ✅ Project seed data
-- ✅ Authentication setup (users created via separate script)
-- ============================================

-- ============================================
-- SECTION 1: CLEANUP (DROP EXISTING OBJECTS)
-- ============================================

-- Drop existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all RLS policies
    FOR r IN (SELECT schemaname, tablename, policyname
              FROM pg_policies
              WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings CASCADE;
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers CASCADE;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects CASCADE;
DROP TRIGGER IF EXISTS update_salam_entries_updated_at ON public.salam_entries CASCADE;
DROP TRIGGER IF EXISTS update_mobily_entries_updated_at ON public.mobily_entries CASCADE;
DROP TRIGGER IF EXISTS update_salam_customers_updated_at ON public.salam_customers CASCADE;
DROP TRIGGER IF EXISTS update_mobily_customers_updated_at ON public.mobily_customers CASCADE;

-- Drop existing tables (cascade to drop dependent objects)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.salam_customers CASCADE;
DROP TABLE IF EXISTS public.mobily_customers CASCADE;
DROP TABLE IF EXISTS public.salam_entries CASCADE;
DROP TABLE IF EXISTS public.mobily_entries CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.log_audit_event(UUID, TEXT, TEXT, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.check_customer_exists(TEXT, project_type) CASCADE;
DROP FUNCTION IF EXISTS public.check_salam_exists(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.check_mobily_exists(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.check_salam_customer_exists(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.check_mobily_customer_exists(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_daily_customer_count(project_type) CASCADE;
DROP FUNCTION IF EXISTS public.get_salam_daily_count() CASCADE;
DROP FUNCTION IF EXISTS public.get_mobily_daily_count() CASCADE;
DROP FUNCTION IF EXISTS public.get_customer_stats_by_date_range(DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.get_stats_by_date_range(DATE, DATE) CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS project_type CASCADE;

-- ============================================
-- SECTION 2: EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- SECTION 3: CUSTOM TYPES (ENUMS)
-- ============================================

-- User role enum
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');

-- User status enum
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

-- Project type enum
CREATE TYPE project_type AS ENUM ('salam', 'mobily');

-- ============================================
-- SECTION 4: CORE TABLES
-- ============================================

-- --------------------------------------------
-- 4.1 PROFILES TABLE (User Management)
-- --------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    username TEXT NOT NULL UNIQUE,
    supervisor_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    status user_status DEFAULT 'active' NOT NULL,
    created_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_by_username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.profiles IS 'Extended user profiles with role-based access control';
COMMENT ON COLUMN public.profiles.username IS 'Primary user identifier (unique)';
COMMENT ON COLUMN public.profiles.role IS 'User role: user, admin, or super_admin';
COMMENT ON COLUMN public.profiles.status IS 'Account status: active, inactive, or suspended';

-- --------------------------------------------
-- 4.2 USER SETTINGS TABLE
-- --------------------------------------------
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    dashboard_access BOOLEAN DEFAULT true NOT NULL,
    admin_privileges BOOLEAN DEFAULT false NOT NULL,
    notifications_enabled BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.user_settings IS 'Per-user application settings and preferences';

-- ============================================
-- SECTION 5: PROJECT TABLES
-- ============================================

-- --------------------------------------------
-- 5.1 PROJECTS TABLE
-- --------------------------------------------
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code project_type NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.projects IS 'Available projects in the system (Salam, Mobily)';

-- --------------------------------------------
-- 5.2 CUSTOMERS TABLE (UNIFIED)
-- --------------------------------------------
CREATE TABLE public.customers (
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

COMMENT ON TABLE public.customers IS 'Unified customer table for all projects (Salam and Mobily)';
COMMENT ON COLUMN public.customers.project IS 'Project type: salam or mobily';

-- --------------------------------------------
-- 5.3 LEGACY CUSTOMER TABLES
-- --------------------------------------------
CREATE TABLE public.salam_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by_username TEXT,
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT salam_customers_identity_unique UNIQUE (identity_number),
    CONSTRAINT salam_customers_sim_unique UNIQUE (sim_number)
);

CREATE TABLE public.mobily_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by_username TEXT,
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    identity_expiry_date TEXT NOT NULL,
    package TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT mobily_customers_identity_unique UNIQUE (identity_number),
    CONSTRAINT mobily_customers_sim_unique UNIQUE (sim_number)
);

-- --------------------------------------------
-- 5.4 LEGACY ENTRIES TABLES
-- --------------------------------------------
CREATE TABLE public.salam_entries (
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

CREATE TABLE public.mobily_entries (
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

-- ============================================
-- SECTION 6: AUDIT & LOGGING
-- ============================================

CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.audit_logs IS 'System-wide audit trail for security and compliance';

-- ============================================
-- SECTION 7: INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_status ON public.profiles(status);
CREATE INDEX idx_profiles_created_by ON public.profiles(created_by_id);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Unified customers indexes
CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_project ON public.customers(project);
CREATE INDEX idx_customers_identity_number ON public.customers(identity_number);
CREATE INDEX idx_customers_sim_number ON public.customers(sim_number);
CREATE INDEX idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX idx_customers_supervisor ON public.customers(supervisor_name);

-- Legacy customer indexes
CREATE INDEX idx_salam_customers_user_id ON public.salam_customers(user_id);
CREATE INDEX idx_salam_customers_identity_number ON public.salam_customers(identity_number);
CREATE INDEX idx_salam_customers_created_at ON public.salam_customers(created_at DESC);

CREATE INDEX idx_mobily_customers_user_id ON public.mobily_customers(user_id);
CREATE INDEX idx_mobily_customers_identity_number ON public.mobily_customers(identity_number);
CREATE INDEX idx_mobily_customers_created_at ON public.mobily_customers(created_at DESC);

-- Legacy entries indexes
CREATE INDEX idx_salam_entries_user_id ON public.salam_entries(user_id);
CREATE INDEX idx_salam_entries_identity_number ON public.salam_entries(identity_number);
CREATE INDEX idx_salam_entries_created_at ON public.salam_entries(created_at DESC);

CREATE INDEX idx_mobily_entries_user_id ON public.mobily_entries(user_id);
CREATE INDEX idx_mobily_entries_identity_number ON public.mobily_entries(identity_number);
CREATE INDEX idx_mobily_entries_created_at ON public.mobily_entries(created_at DESC);

-- Projects indexes
CREATE INDEX idx_projects_code ON public.projects(code);
CREATE INDEX idx_projects_is_active ON public.projects(is_active);

-- ============================================
-- SECTION 8: DATABASE FUNCTIONS
-- ============================================

-- --------------------------------------------
-- 8.1 AUTHENTICATION FUNCTIONS
-- --------------------------------------------

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

-- --------------------------------------------
-- 8.2 UTILITY FUNCTIONS
-- --------------------------------------------

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- 8.3 USER MANAGEMENT FUNCTIONS
-- --------------------------------------------

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
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'supervisor_name',
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role),
        (NEW.raw_user_meta_data->>'created_by_id')::UUID,
        NEW.raw_user_meta_data->>'created_by_username'
    );

    -- Create default user settings
    INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
    VALUES (NEW.id, true, false);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata)
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- 8.4 CUSTOMER EXISTENCE CHECKS
-- --------------------------------------------

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

-- Legacy function for Salam entries
CREATE OR REPLACE FUNCTION public.check_salam_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.salam_entries
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Legacy function for Mobily entries
CREATE OR REPLACE FUNCTION public.check_mobily_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mobily_entries
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Legacy function for Salam customers
CREATE OR REPLACE FUNCTION public.check_salam_customer_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.salam_customers
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Legacy function for Mobily customers
CREATE OR REPLACE FUNCTION public.check_mobily_customer_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mobily_customers
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------
-- 8.5 STATISTICS FUNCTIONS
-- --------------------------------------------

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

-- Legacy function to get today's Salam customer count
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

-- Legacy function to get today's Mobily customer count
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

-- Function to get customer statistics by date range
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

-- Legacy function for backward compatibility
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
-- SECTION 9: TRIGGERS
-- ============================================

-- Trigger to handle new user signups
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger to auto-update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on user_settings
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on customers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on projects
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Legacy triggers for old tables
CREATE TRIGGER update_salam_entries_updated_at
    BEFORE UPDATE ON public.salam_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mobily_entries_updated_at
    BEFORE UPDATE ON public.mobily_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_salam_customers_updated_at
    BEFORE UPDATE ON public.salam_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mobily_customers_updated_at
    BEFORE UPDATE ON public.mobily_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SECTION 10: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salam_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salam_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobily_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- 10.1 PROFILES POLICIES
-- --------------------------------------------

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin(auth.uid()));

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

CREATE POLICY "System inserts profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- --------------------------------------------
-- 10.2 USER SETTINGS POLICIES
-- --------------------------------------------

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

-- --------------------------------------------
-- 10.3 AUDIT LOGS POLICIES
-- --------------------------------------------

CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- --------------------------------------------
-- 10.4 CUSTOMERS POLICIES (UNIFIED)
-- --------------------------------------------

CREATE POLICY "Users can view own customers"
    ON public.customers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all customers"
    ON public.customers FOR SELECT
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own customers"
    ON public.customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers"
    ON public.customers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all customers"
    ON public.customers FOR UPDATE
    USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own customers"
    ON public.customers FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all customers"
    ON public.customers FOR DELETE
    USING (public.is_admin(auth.uid()));

-- --------------------------------------------
-- 10.5 LEGACY CUSTOMER TABLE POLICIES
-- --------------------------------------------

-- Salam Customers
CREATE POLICY "Users can view own salam customers"
    ON public.salam_customers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all salam customers"
    ON public.salam_customers FOR SELECT
    USING (public.is_admin(auth.uid()));

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

CREATE POLICY "Users can delete own salam customers"
    ON public.salam_customers FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all salam customers"
    ON public.salam_customers FOR DELETE
    USING (public.is_admin(auth.uid()));

-- Mobily Customers
CREATE POLICY "Users can view own mobily customers"
    ON public.mobily_customers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mobily customers"
    ON public.mobily_customers FOR SELECT
    USING (public.is_admin(auth.uid()));

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

CREATE POLICY "Users can delete own mobily customers"
    ON public.mobily_customers FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all mobily customers"
    ON public.mobily_customers FOR DELETE
    USING (public.is_admin(auth.uid()));

-- --------------------------------------------
-- 10.6 LEGACY ENTRIES POLICIES
-- --------------------------------------------

-- Salam Entries
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

-- Mobily Entries
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

-- --------------------------------------------
-- 10.7 PROJECTS POLICIES
-- --------------------------------------------

CREATE POLICY "Users can view projects"
    ON public.projects FOR SELECT
    USING (auth.uid() IS NOT NULL);

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
-- SECTION 11: STORAGE BUCKETS & POLICIES
-- ============================================

-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for uploads bucket
CREATE POLICY "Users can upload own files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- SECTION 12: GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant necessary permissions to anon users
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.profiles TO anon;

-- ============================================
-- SECTION 13: INITIAL SEED DATA
-- ============================================

-- Insert default projects
INSERT INTO public.projects (name, code, description, is_active)
VALUES
    ('سلام', 'salam', 'مشروع سلام للاتصالات', true),
    ('موبايلي', 'mobily', 'مشروع موبايلي للاتصالات', true)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- ============================================
-- SECTION 14: COMPLETION & VERIFICATION
-- ============================================

DO $$
DECLARE
    v_tables_count INTEGER;
    v_functions_count INTEGER;
    v_triggers_count INTEGER;
    v_policies_count INTEGER;
BEGIN
    -- Count database objects
    SELECT COUNT(*) INTO v_tables_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    SELECT COUNT(*) INTO v_functions_count
    FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

    SELECT COUNT(*) INTO v_triggers_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';

    SELECT COUNT(*) INTO v_policies_count
    FROM pg_policies
    WHERE schemaname = 'public';

    -- Display success message
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DATABASE REBUILD COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 DATABASE SUMMARY:';
    RAISE NOTICE '   - Tables created: %', v_tables_count;
    RAISE NOTICE '   - Functions created: %', v_functions_count;
    RAISE NOTICE '   - Triggers created: %', v_triggers_count;
    RAISE NOTICE '   - RLS Policies created: %', v_policies_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔐 SECURITY:';
    RAISE NOTICE '   ✅ Row Level Security (RLS) enabled';
    RAISE NOTICE '   ✅ Role-based access control configured';
    RAISE NOTICE '   ✅ Storage buckets and policies created';
    RAISE NOTICE '';
    RAISE NOTICE '📝 NEXT STEPS:';
    RAISE NOTICE '   1. Run the create-predefined-users.js script';
    RAISE NOTICE '   2. Test authentication with predefined credentials';
    RAISE NOTICE '   3. Verify role-based redirects';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🚀 Your database schema is ready!';
    RAISE NOTICE '========================================';
END $$;
