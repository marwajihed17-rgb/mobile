-- ============================================
-- DROP UNUSED TABLES
-- ============================================
-- This migration removes tables that are not needed for the application:
-- - module_access (module access control not used)
-- - file_uploads (file upload tracking not needed)
-- - chat_messages (chat feature removed)
-- - audit_logs (audit logging not implemented)

-- Drop tables (in reverse dependency order to avoid foreign key issues)
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.file_uploads CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.module_access CASCADE;

-- Drop related functions
DROP FUNCTION IF EXISTS public.get_user_modules(UUID) CASCADE;

-- Note: The module_type enum is kept as it might be used elsewhere
-- If you want to remove it completely, uncomment the following line:
-- DROP TYPE IF EXISTS module_type CASCADE;

-- Clean up any orphaned data or constraints
-- (The CASCADE option should handle this, but this is a safety check)

-- Verify tables are dropped
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        RAISE EXCEPTION 'chat_messages table still exists';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'file_uploads') THEN
        RAISE EXCEPTION 'file_uploads table still exists';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
        RAISE EXCEPTION 'audit_logs table still exists';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'module_access') THEN
        RAISE EXCEPTION 'module_access table still exists';
    END IF;

    RAISE NOTICE 'All specified tables have been successfully dropped';
END
$$;
