-- ============================================
-- CREATE SUPER ADMIN USER
-- ============================================
-- This script creates a super admin user in your database
-- Run this AFTER you've run the complete_database_setup.sql
-- ============================================

-- Option 1: Create admin user via auth.users (RECOMMENDED)
-- First create the user in Supabase Dashboard → Authentication
-- Then run this to upgrade their role:

UPDATE public.profiles
SET
    role = 'super_admin',
    status = 'active',
    full_name = 'Super Administrator',
    username = 'admin'
WHERE email = 'admin@retaam.app'; -- Replace with your admin email

-- Option 2: Direct insertion (USE WITH CAUTION)
-- This bypasses normal authentication flow
-- Only use for development/testing

/*
-- Insert into auth.users first (this would typically be done via Supabase Auth API)
-- Then the trigger will automatically create the profile

-- Manual profile creation if trigger didn't work:
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    role,
    status
)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid, -- Replace with actual UUID from auth.users
    'admin@retaam.app',
    'Super Administrator',
    'admin',
    'super_admin',
    'active'
)
ON CONFLICT (id) DO UPDATE
SET
    role = 'super_admin',
    status = 'active';
*/

-- Verify the admin user was created
SELECT
    id,
    email,
    username,
    full_name,
    role,
    status,
    created_at
FROM public.profiles
WHERE role IN ('admin', 'super_admin')
ORDER BY created_at DESC;

-- ============================================
-- CREATE ADDITIONAL ADMIN USERS
-- ============================================

-- After creating users in Supabase Dashboard, upgrade them to admin:
/*
UPDATE public.profiles
SET role = 'admin'
WHERE email IN ('user1@retaam.app', 'user2@retaam.app');
*/

-- ============================================
-- CREATE OPERATOR USERS
-- ============================================

-- Create operator users:
/*
UPDATE public.profiles
SET role = 'operator', status = 'active'
WHERE email IN ('operator1@retaam.app', 'operator2@retaam.app');
*/

-- ============================================
-- VERIFY PERMISSIONS
-- ============================================

-- Check if admin can see all tables
SELECT
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE grantee = 'authenticated'
AND table_schema = 'public'
AND table_name IN ('profiles', 'salam_customers', 'mobily_customers')
ORDER BY table_name, privilege_type;
