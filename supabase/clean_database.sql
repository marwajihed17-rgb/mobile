-- ============================================
-- COMPLETE DATABASE CLEANUP SCRIPT
-- ============================================
-- ⚠️ WARNING: This will DELETE ALL data and objects!
-- Only use this if you want a completely fresh start.
-- ============================================

-- Step 1: Drop all RLS policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename || ' CASCADE';
    END LOOP;
END $$;

-- Step 2: Drop all triggers
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_schema, trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON ' || r.trigger_schema || '.' || r.event_object_table || ' CASCADE';
    END LOOP;
END $$;

-- Step 3: Drop all views
DROP VIEW IF EXISTS public.daily_stats CASCADE;
DROP VIEW IF EXISTS public.customers_with_users CASCADE;
DROP VIEW IF EXISTS public.salam_daily_stats CASCADE;
DROP VIEW IF EXISTS public.mobily_daily_stats CASCADE;
DROP VIEW IF EXISTS public.daily_stats_summary CASCADE;

-- Step 4: Drop all tables
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.file_uploads CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.daily_customer_totals CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.mobily_customers CASCADE;
DROP TABLE IF EXISTS public.salam_customers CASCADE;
DROP TABLE IF EXISTS public.mobily_entries CASCADE;
DROP TABLE IF EXISTS public.salam_entries CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.module_access CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 5: Drop all functions
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_modules(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.log_audit_event(UUID, TEXT, TEXT, UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.check_customer_exists(TEXT, project_type) CASCADE;
DROP FUNCTION IF EXISTS public.check_salam_exists(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.check_mobily_exists(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.check_salam_customer_exists(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.check_mobily_customer_exists(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_daily_customer_count(project_type) CASCADE;
DROP FUNCTION IF EXISTS public.get_salam_daily_count() CASCADE;
DROP FUNCTION IF EXISTS public.get_mobily_daily_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_daily_totals() CASCADE;
DROP FUNCTION IF EXISTS public.get_customer_stats_by_date_range(DATE, DATE) CASCADE;
DROP FUNCTION IF EXISTS public.get_stats_by_date_range(DATE, DATE) CASCADE;

-- Step 6: Drop all custom types (enums)
DROP TYPE IF EXISTS public.project_type CASCADE;
DROP TYPE IF EXISTS public.module_type CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Step 7: Drop storage policies
DO $$
DECLARE
    r RECORD;
    storage_policies_exist BOOLEAN;
BEGIN
    -- Check if storage.policies table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'storage'
        AND table_name = 'policies'
    ) INTO storage_policies_exist;

    -- Only try to drop policies if the table exists
    IF storage_policies_exist THEN
        FOR r IN (SELECT * FROM storage.policies)
        LOOP
            EXECUTE 'DROP POLICY IF EXISTS "' || r.name || '" ON storage.objects';
        END LOOP;
    ELSE
        RAISE NOTICE 'Storage policies table does not exist, skipping...';
    END IF;
END $$;

-- Step 8: Drop storage buckets (optional - uncomment if you want to delete uploaded files too)
-- DELETE FROM storage.buckets WHERE id = 'uploads';
-- DELETE FROM storage.buckets WHERE id = 'avatars';

-- ============================================
-- CLEANUP COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DATABASE CLEANUP COMPLETED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All database objects have been removed:';
    RAISE NOTICE '  ✅ All RLS policies dropped';
    RAISE NOTICE '  ✅ All triggers dropped';
    RAISE NOTICE '  ✅ All views dropped';
    RAISE NOTICE '  ✅ All tables dropped';
    RAISE NOTICE '  ✅ All functions dropped';
    RAISE NOTICE '  ✅ All custom types dropped';
    RAISE NOTICE '  ✅ All storage policies dropped';
    RAISE NOTICE '';
    RAISE NOTICE '📝 NEXT STEP:';
    RAISE NOTICE '   Run rebuild_database.sql to create fresh database';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
