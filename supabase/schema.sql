-- ============================================
-- PAA SOLUTIONS - CLEANED DATABASE SCHEMA
-- ============================================
-- This SQL file contains the active database schema
-- for the PAA Solutions SaaS application.
-- Run this in your Supabase SQL Editor for fresh setups.
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOM TYPES (ENUMS)
-- ============================================

-- User role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User status enum
DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Project type enum
DO $$ BEGIN
    CREATE TYPE project_type AS ENUM ('salam', 'mobily');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Calendar type enum (for Hijri/Gregorian dates)
DO $$ BEGIN
    CREATE TYPE calendar_type AS ENUM ('gregorian', 'hijri');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles table (extends Supabase auth.users)
-- This serves as the 'users' table for the application
CREATE TABLE IF NOT EXISTS public.profiles (
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
-- PROJECT TABLES
-- ============================================

-- Salam Customers Table
CREATE TABLE IF NOT EXISTS public.salam_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by_username TEXT,

    -- Salam-specific fields (7 fields)
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,

    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints: identity_number and sim_number must be unique within Salam project
    CONSTRAINT salam_customers_identity_unique UNIQUE (identity_number),
    CONSTRAINT salam_customers_sim_unique UNIQUE (sim_number)
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
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,

    -- Mobily-specific additional fields (6 more fields)
    birth_date TEXT NOT NULL,
    birth_date_calendar calendar_type DEFAULT 'gregorian',
    identity_expiry_date TEXT NOT NULL,
    identity_expiry_calendar calendar_type DEFAULT 'gregorian',
    package TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,

    -- System fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints: identity_number and sim_number must be unique within Mobily project
    CONSTRAINT mobily_customers_identity_unique UNIQUE (identity_number),
    CONSTRAINT mobily_customers_sim_unique UNIQUE (sim_number)
);

-- ============================================
-- INDEXES
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_by ON public.profiles(created_by_id);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Salam customers indexes
CREATE INDEX IF NOT EXISTS idx_salam_customers_user_id ON public.salam_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_salam_customers_identity_number ON public.salam_customers(identity_number);
CREATE INDEX IF NOT EXISTS idx_salam_customers_sim_number ON public.salam_customers(sim_number);
CREATE INDEX IF NOT EXISTS idx_salam_customers_created_at ON public.salam_customers(created_at DESC);

-- Mobily customers indexes
CREATE INDEX IF NOT EXISTS idx_mobily_customers_user_id ON public.mobily_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_mobily_customers_identity_number ON public.mobily_customers(identity_number);
CREATE INDEX IF NOT EXISTS idx_mobily_customers_sim_number ON public.mobily_customers(sim_number);
CREATE INDEX IF NOT EXISTS idx_mobily_customers_created_at ON public.mobily_customers(created_at DESC);

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
-- TRIGGERS
-- ============================================

-- Trigger to auto-update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on salam_customers
DROP TRIGGER IF EXISTS update_salam_customers_updated_at ON public.salam_customers;
CREATE TRIGGER update_salam_customers_updated_at
    BEFORE UPDATE ON public.salam_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on mobily_customers
DROP TRIGGER IF EXISTS update_mobily_customers_updated_at ON public.mobily_customers;
CREATE TRIGGER update_mobily_customers_updated_at
    BEFORE UPDATE ON public.mobily_customers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to handle new user signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salam_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobily_customers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "System inserts profiles" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Users can update their own profile (limited fields)
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

-- Super admins can update any profile
CREATE POLICY "Super admins can update any profile"
    ON public.profiles FOR UPDATE
    USING (public.is_super_admin(auth.uid()));

-- Only the system can insert profiles (via trigger)
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

-- Users can view their own settings
CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all user settings
CREATE POLICY "Admins can view all user settings"
    ON public.user_settings FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Users can update their own non-admin settings
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

-- Admins can update any user settings
CREATE POLICY "Admins can update any user settings"
    ON public.user_settings FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- System inserts settings (via trigger)
CREATE POLICY "System inserts settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
    ON public.audit_logs FOR INSERT
    WITH CHECK (true);

-- ============================================
-- SALAM CUSTOMERS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Admins can view all salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Users can insert own salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Users can update own salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Admins can update all salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Users can delete own salam customers" ON public.salam_customers;
DROP POLICY IF EXISTS "Admins can delete all salam customers" ON public.salam_customers;

-- Users can view their own salam customers
CREATE POLICY "Users can view own salam customers"
    ON public.salam_customers FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all salam customers
CREATE POLICY "Admins can view all salam customers"
    ON public.salam_customers FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Users can insert their own salam customers
CREATE POLICY "Users can insert own salam customers"
    ON public.salam_customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own salam customers
CREATE POLICY "Users can update own salam customers"
    ON public.salam_customers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can update all salam customers
CREATE POLICY "Admins can update all salam customers"
    ON public.salam_customers FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Users can delete their own salam customers
CREATE POLICY "Users can delete own salam customers"
    ON public.salam_customers FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can delete all salam customers
CREATE POLICY "Admins can delete all salam customers"
    ON public.salam_customers FOR DELETE
    USING (public.is_admin(auth.uid()));

-- ============================================
-- MOBILY CUSTOMERS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Admins can view all mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Users can insert own mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Users can update own mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Admins can update all mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Users can delete own mobily customers" ON public.mobily_customers;
DROP POLICY IF EXISTS "Admins can delete all mobily customers" ON public.mobily_customers;

-- Users can view their own mobily customers
CREATE POLICY "Users can view own mobily customers"
    ON public.mobily_customers FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all mobily customers
CREATE POLICY "Admins can view all mobily customers"
    ON public.mobily_customers FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Users can insert their own mobily customers
CREATE POLICY "Users can insert own mobily customers"
    ON public.mobily_customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own mobily customers
CREATE POLICY "Users can update own mobily customers"
    ON public.mobily_customers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can update all mobily customers
CREATE POLICY "Admins can update all mobily customers"
    ON public.mobily_customers FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Users can delete their own mobily customers
CREATE POLICY "Users can delete own mobily customers"
    ON public.mobily_customers FOR DELETE
    USING (auth.uid() = user_id);

-- Admins can delete all mobily customers
CREATE POLICY "Admins can delete all mobily customers"
    ON public.mobily_customers FOR DELETE
    USING (public.is_admin(auth.uid()));

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Users can upload to their own folder in uploads bucket
DROP POLICY IF EXISTS "Users can upload own files" ON storage.objects;
CREATE POLICY "Users can upload own files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can view their own uploaded files
DROP POLICY IF EXISTS "Users can view own files" ON storage.objects;
CREATE POLICY "Users can view own files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own files
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'uploads'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can upload their own avatar
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Anyone can view avatars (public bucket)
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- Users can update their own avatar
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions on views
GRANT SELECT ON public.salam_daily_stats TO authenticated;
GRANT SELECT ON public.mobily_daily_stats TO authenticated;
GRANT SELECT ON public.daily_stats_summary TO authenticated;

-- Grant necessary permissions to anon users (minimal)
GRANT USAGE ON SCHEMA public TO anon;
