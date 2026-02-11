-- ============================================
-- SETUP CRON JOBS FOR DAILY RESET
-- ============================================
-- This sets up automatic daily reset at 00:30
-- Requires pg_cron extension (enabled by default in Supabase)
-- ============================================

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- DAILY BASELINE RESET JOB
-- ============================================

-- Remove existing job if it exists
SELECT cron.unschedule('daily-baseline-reset')
WHERE EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = 'daily-baseline-reset'
);

-- Schedule daily baseline reset at 00:30
SELECT cron.schedule(
    'daily-baseline-reset',                      -- Job name
    '30 0 * * *',                                -- Run at 00:30 every day
    $$SELECT public.record_daily_baseline()$$   -- SQL to execute
);

-- ============================================
-- VERIFY CRON JOB
-- ============================================

-- List all scheduled cron jobs
SELECT
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job
WHERE jobname = 'daily-baseline-reset';

-- ============================================
-- MANUAL TRIGGER (FOR TESTING)
-- ============================================

-- You can manually trigger the baseline reset for testing:
-- SELECT public.record_daily_baseline();

-- ============================================
-- CHECK CRON JOB HISTORY
-- ============================================

-- View recent cron job runs
SELECT
    jobid,
    runid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time
FROM cron.job_run_details
WHERE jobid = (
    SELECT jobid FROM cron.job
    WHERE jobname = 'daily-baseline-reset'
)
ORDER BY start_time DESC
LIMIT 10;

-- ============================================
-- ADDITIONAL CRON JOBS (OPTIONAL)
-- ============================================

-- Clean up old audit logs (keep last 90 days)
/*
SELECT cron.schedule(
    'cleanup-old-audit-logs',
    '0 2 * * 0',  -- Run at 2 AM every Sunday
    $$DELETE FROM public.audit_logs WHERE created_at < NOW() - INTERVAL '90 days'$$
);
*/

-- Generate daily statistics snapshot
/*
SELECT cron.schedule(
    'daily-stats-snapshot',
    '0 23 * * *',  -- Run at 11 PM daily
    $$
    INSERT INTO public.daily_customer_totals (date, project, total_customers, unique_users)
    SELECT
        CURRENT_DATE,
        'salam'::project_type,
        COUNT(*)::INTEGER,
        COUNT(DISTINCT user_id)::INTEGER
    FROM public.salam_customers
    WHERE DATE(created_at) = CURRENT_DATE
    ON CONFLICT (date, project) DO UPDATE
    SET total_customers = EXCLUDED.total_customers,
        unique_users = EXCLUDED.unique_users,
        updated_at = NOW();

    INSERT INTO public.daily_customer_totals (date, project, total_customers, unique_users)
    SELECT
        CURRENT_DATE,
        'mobily'::project_type,
        COUNT(*)::INTEGER,
        COUNT(DISTINCT user_id)::INTEGER
    FROM public.mobily_customers
    WHERE DATE(created_at) = CURRENT_DATE
    ON CONFLICT (date, project) DO UPDATE
    SET total_customers = EXCLUDED.total_customers,
        unique_users = EXCLUDED.unique_users,
        updated_at = NOW();
    $$
);
*/
