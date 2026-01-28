-- ============================================
-- Migration: Add operator role to user_role enum
-- Date: 2026-01-28
-- Description: Add 'operator' value to the user_role enum type
--              to support the new المشغل (operator) user role
-- ============================================

-- Add 'operator' to the user_role enum if it doesn't exist
DO $$ BEGIN
    -- Check if 'operator' value exists in user_role enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'user_role'::regtype
        AND enumlabel = 'operator'
    ) THEN
        ALTER TYPE user_role ADD VALUE 'operator';
    END IF;
EXCEPTION
    WHEN invalid_parameter_value THEN
        -- Value already exists, ignore
        NULL;
    WHEN undefined_object THEN
        -- Enum doesn't exist, create it with all values
        CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin', 'operator');
END $$;

-- ============================================
-- Verification query (for testing)
-- ============================================
-- You can run this to verify the enum was updated:
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'user_role'::regtype;
