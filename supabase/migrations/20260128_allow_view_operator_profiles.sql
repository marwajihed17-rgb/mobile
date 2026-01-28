-- ============================================
-- Migration: Allow all users to view operator profiles
-- Date: 2026-01-28
-- Description: Add RLS policy to allow all authenticated users
--              to view profiles with role='operator' for the
--              المشغل dropdown in the user dashboard
-- ============================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "All users can view operator profiles" ON public.profiles;

-- Create policy to allow all authenticated users to view operator profiles
-- This enables the المشغل dropdown to show operator users for all users
CREATE POLICY "All users can view operator profiles"
    ON public.profiles FOR SELECT
    USING (
        -- Allow viewing if the profile has role='operator' and is active
        role = 'operator' AND status = 'active'
    );

-- ============================================
-- Verification query (for testing)
-- ============================================
-- You can run this to verify the policy was created:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
