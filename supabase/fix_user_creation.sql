-- Fix the handle_new_user trigger to handle conflicts gracefully
-- This allows both API-based and manual user creation to work

-- Drop and recreate the function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create profile if it doesn't already exist
    -- This allows the API to create profiles explicitly
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        -- Create profile with fallback for username
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
            -- Use username from metadata, or generate from email if not provided
            COALESCE(
                NEW.raw_user_meta_data->>'username',
                NEW.raw_user_meta_data->>'full_name',
                -- Generate unique username from email (before @)
                split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 8)
            ),
            NEW.raw_user_meta_data->>'supervisor_name',
            COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role),
            (NEW.raw_user_meta_data->>'created_by_id')::UUID,
            NEW.raw_user_meta_data->>'created_by_username'
        )
        ON CONFLICT (id) DO NOTHING;  -- Handle race conditions

        -- Create default user settings (only if profile was created)
        INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
        VALUES (NEW.id, true, false)
        ON CONFLICT (user_id) DO NOTHING;  -- Handle race conditions

        -- Grant access to all modules by default
        INSERT INTO public.module_access (user_id, module_type, has_access)
        VALUES
            (NEW.id, 'invoice', true),
            (NEW.id, 'kdr', true),
            (NEW.id, 'ga', true),
            (NEW.id, 'kdr_inv', true),
            (NEW.id, 'kdr_sellout', true)
        ON CONFLICT (user_id, module_type) DO NOTHING;  -- Handle race conditions
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Add a helper function to safely create users from the admin API
CREATE OR REPLACE FUNCTION public.create_user_profile(
    p_user_id UUID,
    p_email TEXT,
    p_username TEXT,
    p_supervisor_name TEXT,
    p_role user_role DEFAULT 'user'::user_role
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert profile with ON CONFLICT to handle trigger race condition
    INSERT INTO public.profiles (
        id,
        email,
        username,
        supervisor_name,
        role,
        status
    )
    VALUES (
        p_user_id,
        p_email,
        p_username,
        p_supervisor_name,
        p_role,
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        supervisor_name = EXCLUDED.supervisor_name,
        role = EXCLUDED.role,
        status = EXCLUDED.status;

    -- Create user settings
    INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
    VALUES (p_user_id, true, false)
    ON CONFLICT (user_id) DO NOTHING;

    -- Grant module access
    INSERT INTO public.module_access (user_id, module_type, has_access)
    VALUES
        (p_user_id, 'invoice', true),
        (p_user_id, 'kdr', true),
        (p_user_id, 'ga', true),
        (p_user_id, 'kdr_inv', true),
        (p_user_id, 'kdr_sellout', true)
    ON CONFLICT (user_id, module_type) DO NOTHING;

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error in create_user_profile: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
