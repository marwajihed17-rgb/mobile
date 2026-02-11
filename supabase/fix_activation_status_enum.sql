-- ============================================
-- FIX: Add 'confirmed' to activation_status enum
-- ============================================
-- Run this if you get error: invalid input value for enum activation_status: "confirmed"
-- This adds the 'confirmed' value to the existing enum
-- ============================================

-- Add 'confirmed' to activation_status enum if it doesn't exist
DO $$
BEGIN
    -- Check if the enum value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'activation_status'::regtype
        AND enumlabel = 'confirmed'
    ) THEN
        -- Add the 'confirmed' value to the enum
        ALTER TYPE activation_status ADD VALUE 'confirmed';
        RAISE NOTICE '✅ Added "confirmed" to activation_status enum';
    ELSE
        RAISE NOTICE 'ℹ️  "confirmed" already exists in activation_status enum';
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- If enum doesn't exist, create it with all values
        CREATE TYPE activation_status AS ENUM ('activated', 'activating', 'confirmed');
        RAISE NOTICE '✅ Created activation_status enum with all values';
END $$;

-- Verify the enum values
SELECT enumlabel as available_values
FROM pg_enum
WHERE enumtypid = 'activation_status'::regtype
ORDER BY enumsortorder;
