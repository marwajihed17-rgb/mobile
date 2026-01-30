-- ============================================
-- Migration: Add Daily Reset Stats and New Fields
-- Date: 2026-01-30
-- ============================================

-- 1. Create table to store daily stats baseline (previous day's final totals)
CREATE TABLE IF NOT EXISTS public.stats_daily_baseline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    project project_type NOT NULL,
    baseline_total INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Unique constraint: one baseline per date per project
    CONSTRAINT stats_baseline_date_project_unique UNIQUE (date, project)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_stats_baseline_date ON public.stats_daily_baseline(date DESC);
CREATE INDEX IF NOT EXISTS idx_stats_baseline_project ON public.stats_daily_baseline(project);

-- Enable RLS
ALTER TABLE public.stats_daily_baseline ENABLE ROW LEVEL SECURITY;

-- Policies for stats_daily_baseline
CREATE POLICY "Users can view stats baseline"
    ON public.stats_daily_baseline FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert stats baseline"
    ON public.stats_daily_baseline FOR INSERT
    WITH CHECK (true);

CREATE POLICY "System can update stats baseline"
    ON public.stats_daily_baseline FOR UPDATE
    USING (true);

-- Grant permissions
GRANT ALL ON public.stats_daily_baseline TO authenticated;

-- 2. Add 'package' column to salam_customers (الباقة)
ALTER TABLE public.salam_customers
ADD COLUMN IF NOT EXISTS package TEXT;

-- 3. Add 'price' column to mobily_customers (السعر)
ALTER TABLE public.mobily_customers
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);

-- 4. Function to get baseline total for a project for today
CREATE OR REPLACE FUNCTION public.get_stats_baseline(p_project project_type)
RETURNS INTEGER AS $$
DECLARE
    v_baseline INTEGER;
BEGIN
    -- Get the most recent baseline (yesterday's final total becomes today's starting point)
    SELECT baseline_total
    INTO v_baseline
    FROM public.stats_daily_baseline
    WHERE project = p_project
    ORDER BY date DESC
    LIMIT 1;

    RETURN COALESCE(v_baseline, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function to record daily baseline at midnight + 30 minutes
-- This stores the previous day's final total as the baseline for the new day
CREATE OR REPLACE FUNCTION public.record_daily_baseline()
RETURNS void AS $$
DECLARE
    v_yesterday DATE;
    v_today DATE;
    v_salam_total INTEGER;
    v_mobily_total INTEGER;
    v_salam_previous_baseline INTEGER;
    v_mobily_previous_baseline INTEGER;
BEGIN
    v_yesterday := CURRENT_DATE - INTERVAL '1 day';
    v_today := CURRENT_DATE;

    -- Get previous baseline (to continue counting from)
    SELECT COALESCE(baseline_total, 0) INTO v_salam_previous_baseline
    FROM public.stats_daily_baseline
    WHERE project = 'salam'
    ORDER BY date DESC
    LIMIT 1;

    SELECT COALESCE(baseline_total, 0) INTO v_mobily_previous_baseline
    FROM public.stats_daily_baseline
    WHERE project = 'mobily'
    ORDER BY date DESC
    LIMIT 1;

    -- Count yesterday's records
    SELECT COUNT(*)::INTEGER INTO v_salam_total
    FROM public.salam_customers
    WHERE DATE(created_at) = v_yesterday;

    SELECT COUNT(*)::INTEGER INTO v_mobily_total
    FROM public.mobily_customers
    WHERE DATE(created_at) = v_yesterday;

    -- Calculate new baseline: previous baseline + yesterday's count
    v_salam_total := COALESCE(v_salam_previous_baseline, 0) + COALESCE(v_salam_total, 0);
    v_mobily_total := COALESCE(v_mobily_previous_baseline, 0) + COALESCE(v_mobily_total, 0);

    -- Insert or update baseline for today
    INSERT INTO public.stats_daily_baseline (date, project, baseline_total)
    VALUES (v_today, 'salam', v_salam_total)
    ON CONFLICT (date, project)
    DO UPDATE SET
        baseline_total = v_salam_total,
        updated_at = NOW();

    INSERT INTO public.stats_daily_baseline (date, project, baseline_total)
    VALUES (v_today, 'mobily', v_mobily_total)
    ON CONFLICT (date, project)
    DO UPDATE SET
        baseline_total = v_mobily_total,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_stats_baseline(project_type) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_daily_baseline() TO authenticated;

-- 6. Trigger to update updated_at on stats_daily_baseline
DROP TRIGGER IF EXISTS update_stats_baseline_updated_at ON public.stats_daily_baseline;
CREATE TRIGGER update_stats_baseline_updated_at
    BEFORE UPDATE ON public.stats_daily_baseline
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
