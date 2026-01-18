-- Migration to update RLS policies for salam_entries and mobily_entries
-- Allow users to update and delete their own entries

-- ============================================
-- UPDATE SALAM ENTRIES POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can update salam entries" ON public.salam_entries;
DROP POLICY IF EXISTS "Admins can delete salam entries" ON public.salam_entries;

-- Create new policies
CREATE POLICY "Users can update own salam entries"
    ON public.salam_entries FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own salam entries"
    ON public.salam_entries FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- ============================================
-- UPDATE MOBILY ENTRIES POLICIES
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Admins can update mobily entries" ON public.mobily_entries;
DROP POLICY IF EXISTS "Admins can delete mobily entries" ON public.mobily_entries;

-- Create new policies
CREATE POLICY "Users can update own mobily entries"
    ON public.mobily_entries FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can delete own mobily entries"
    ON public.mobily_entries FOR DELETE
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
