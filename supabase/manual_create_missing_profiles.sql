-- ============================================
-- MANUALLY CREATE MISSING PROFILES
-- ============================================
-- Use this if users authenticated but profiles weren't created
-- This happens when the trigger fails due to enum or other errors
-- ============================================

-- First, find users without profiles
SELECT
    au.id,
    au.email,
    au.created_at,
    'Missing profile' as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- ============================================
-- OPTION 1: Create profiles for ALL users without profiles
-- ============================================
-- Run this to automatically create profiles for all auth users that don't have one

DO $$
DECLARE
    user_record RECORD;
    created_count INTEGER := 0;
BEGIN
    -- Loop through all auth users without profiles
    FOR user_record IN
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        BEGIN
            -- Create profile
            INSERT INTO public.profiles (
                id,
                email,
                full_name,
                username,
                role,
                status
            )
            VALUES (
                user_record.id,
                user_record.email,
                COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email),
                COALESCE(user_record.raw_user_meta_data->>'username', SPLIT_PART(user_record.email, '@', 1)),
                COALESCE((user_record.raw_user_meta_data->>'role')::user_role, 'user'::user_role),
                'active'::user_status
            );

            -- Create default user settings
            INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
            VALUES (user_record.id, true, false)
            ON CONFLICT (user_id) DO NOTHING;

            -- Grant access to all modules
            INSERT INTO public.module_access (user_id, module_type, has_access)
            VALUES
                (user_record.id, 'invoice', true),
                (user_record.id, 'kdr', true),
                (user_record.id, 'ga', true),
                (user_record.id, 'kdr_inv', true),
                (user_record.id, 'kdr_sellout', true)
            ON CONFLICT (user_id, module_type) DO NOTHING;

            created_count := created_count + 1;
            RAISE NOTICE 'Created profile for: %', user_record.email;

        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to create profile for %: %', user_record.email, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '✅ Created % missing profiles', created_count;
END $$;

-- ============================================
-- OPTION 2: Create profile for specific user (manual)
-- ============================================
-- Replace the values below with the actual user data

/*
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    role,
    status
)
VALUES (
    'USER_UUID_HERE',  -- Get this from auth.users
    'user@example.com',
    'User Full Name',
    'username',
    'user'::user_role,  -- or 'admin', 'super_admin', 'operator'
    'active'::user_status
);

-- Create user settings
INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
VALUES ('USER_UUID_HERE', true, false);

-- Grant module access
INSERT INTO public.module_access (user_id, module_type, has_access)
VALUES
    ('USER_UUID_HERE', 'invoice', true),
    ('USER_UUID_HERE', 'kdr', true),
    ('USER_UUID_HERE', 'ga', true),
    ('USER_UUID_HERE', 'kdr_inv', true),
    ('USER_UUID_HERE', 'kdr_sellout', true);
*/

-- ============================================
-- VERIFY: Check if profiles were created
-- ============================================
SELECT
    p.id,
    p.email,
    p.username,
    p.role,
    p.status,
    p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 10;
