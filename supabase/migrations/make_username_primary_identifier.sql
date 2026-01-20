-- Make username the primary identifier instead of email
-- This migration makes username NOT NULL and UNIQUE

-- First, ensure all existing profiles have a username
UPDATE public.profiles
SET username = split_part(email, '@', 1)
WHERE username IS NULL OR username = '';

-- Make username NOT NULL
ALTER TABLE public.profiles
ALTER COLUMN username SET NOT NULL;

-- Add unique constraint on username
ALTER TABLE public.profiles
ADD CONSTRAINT unique_username UNIQUE (username);

-- Update the handle_new_user function to ensure username is always set
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile with username as required field
    INSERT INTO public.profiles (id, email, full_name, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            split_part(NEW.email, '@', 1)
        )
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
