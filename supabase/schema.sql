-- ============================================
-- PAA SOLUTIONS - COMPLETE DATABASE SCHEMA
-- ============================================
-- This SQL file contains all the database objects needed
-- for the PAA Solutions SaaS application.
-- Run this in your Supabase SQL Editor.
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

-- Module type enum
DO $$ BEGIN
    CREATE TYPE module_type AS ENUM ('invoice', 'kdr', 'ga', 'kdr_inv', 'kdr_sellout');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    status user_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Module access table (which modules a user can access)
CREATE TABLE IF NOT EXISTS public.module_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_type module_type NOT NULL,
    has_access BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, module_type)
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

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    module_type module_type NOT NULL,
    content TEXT NOT NULL,
    is_bot BOOLEAN DEFAULT false NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- File uploads table
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    module_type module_type,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
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
-- NEW TABLES: SALAM AND MOBILY PROJECTS
-- ============================================

-- Salam Project Entries Table
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

-- Mobily Project Entries Table
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

-- ============================================
-- INDEXES
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Module access indexes
CREATE INDEX IF NOT EXISTS idx_module_access_user_id ON public.module_access(user_id);
CREATE INDEX IF NOT EXISTS idx_module_access_module_type ON public.module_access(module_type);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_module_type ON public.chat_messages(module_type);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- File uploads indexes
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON public.file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_module_type ON public.file_uploads(module_type);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- Salam entries indexes
CREATE INDEX IF NOT EXISTS idx_salam_entries_user_id ON public.salam_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_salam_entries_identity_number ON public.salam_entries(identity_number);
CREATE INDEX IF NOT EXISTS idx_salam_entries_created_at ON public.salam_entries(created_at DESC);

-- Mobily entries indexes
CREATE INDEX IF NOT EXISTS idx_mobily_entries_user_id ON public.mobily_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mobily_entries_identity_number ON public.mobily_entries(identity_number);
CREATE INDEX IF NOT EXISTS idx_mobily_entries_created_at ON public.mobily_entries(created_at DESC);

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

-- Function to get modules a user has access to
CREATE OR REPLACE FUNCTION public.get_user_modules(check_user_id UUID)
RETURNS module_type[] AS $$
DECLARE
    modules module_type[];
BEGIN
    SELECT ARRAY_AGG(module_type)
    INTO modules
    FROM public.module_access
    WHERE user_id = check_user_id AND has_access = true;

    RETURN COALESCE(modules, '{}');
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
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );

    -- Create default user settings
    INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
    VALUES (NEW.id, true, false);

    -- Grant access to all modules by default (can be customized)
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

-- Function to check if Salam entry exists
CREATE OR REPLACE FUNCTION public.check_salam_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.salam_entries
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if Mobily entry exists
CREATE OR REPLACE FUNCTION public.check_mobily_exists(p_identity_number TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.mobily_entries
        WHERE identity_number = p_identity_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to auto-update updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on module_access
DROP TRIGGER IF EXISTS update_module_access_updated_at ON public.module_access;
CREATE TRIGGER update_module_access_updated_at
    BEFORE UPDATE ON public.module_access
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on user_settings
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on salam_entries
DROP TRIGGER IF EXISTS update_salam_entries_updated_at ON public.salam_entries;
CREATE TRIGGER update_salam_entries_updated_at
    BEFORE UPDATE ON public.salam_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-update updated_at on mobily_entries
DROP TRIGGER IF EXISTS update_mobily_entries_updated_at ON public.mobily_entries;
CREATE TRIGGER update_mobily_entries_updated_at
    BEFORE UPDATE ON public.mobily_entries
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
ALTER TABLE public.module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salam_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobily_entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Drop existing policies if they exist
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
-- MODULE ACCESS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own module access" ON public.module_access;
DROP POLICY IF EXISTS "Admins can view all module access" ON public.module_access;
DROP POLICY IF EXISTS "Admins can insert module access" ON public.module_access;
DROP POLICY IF EXISTS "Admins can update module access" ON public.module_access;
DROP POLICY IF EXISTS "Admins can delete module access" ON public.module_access;

-- Users can view their own module access
CREATE POLICY "Users can view own module access"
    ON public.module_access FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all module access
CREATE POLICY "Admins can view all module access"
    ON public.module_access FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Only admins can insert module access
CREATE POLICY "Admins can insert module access"
    ON public.module_access FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can update module access
CREATE POLICY "Admins can update module access"
    ON public.module_access FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Only admins can delete module access
CREATE POLICY "Admins can delete module access"
    ON public.module_access FOR DELETE
    USING (public.is_admin(auth.uid()));

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
-- CHAT MESSAGES POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON public.chat_messages;

-- Users can view their own messages
CREATE POLICY "Users can view own messages"
    ON public.chat_messages FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users can insert own messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
    ON public.chat_messages FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- FILE UPLOADS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own uploads" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can insert own uploads" ON public.file_uploads;
DROP POLICY IF EXISTS "Users can delete own uploads" ON public.file_uploads;

-- Users can view their own uploads
CREATE POLICY "Users can view own uploads"
    ON public.file_uploads FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own uploads
CREATE POLICY "Users can insert own uploads"
    ON public.file_uploads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
    ON public.file_uploads FOR DELETE
    USING (auth.uid() = user_id);

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
-- SALAM ENTRIES POLICIES
-- ============================================

-- Users can view all salam entries
CREATE POLICY "Users can view salam entries"
    ON public.salam_entries FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Users can insert salam entries
CREATE POLICY "Users can insert salam entries"
    ON public.salam_entries FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own salam entries, admins can update all
CREATE POLICY "Users can update own salam entries"
    ON public.salam_entries FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Users can delete their own salam entries, admins can delete all
CREATE POLICY "Users can delete own salam entries"
    ON public.salam_entries FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============================================
-- MOBILY ENTRIES POLICIES
-- ============================================

-- Users can view all mobily entries
CREATE POLICY "Users can view mobily entries"
    ON public.mobily_entries FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Users can insert mobily entries
CREATE POLICY "Users can insert mobily entries"
    ON public.mobily_entries FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own mobily entries, admins can update all
CREATE POLICY "Users can update own mobily entries"
    ON public.mobily_entries FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Users can delete their own mobily entries, admins can delete all
CREATE POLICY "Users can delete own mobily entries"
    ON public.mobily_entries FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

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

-- Grant necessary permissions to anon users (for public data if needed)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.profiles TO anon;
