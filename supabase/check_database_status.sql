-- ============================================
-- DATABASE STATUS CHECK
-- ============================================
-- Run this query in Supabase SQL Editor to see what exists
-- ============================================

-- Check existing tables
SELECT 'TABLES' as object_type, COUNT(*)::text as count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'

UNION ALL

-- Check existing functions
SELECT 'FUNCTIONS', COUNT(*)::text
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'

UNION ALL

-- Check existing views
SELECT 'VIEWS', COUNT(*)::text
FROM information_schema.views
WHERE table_schema = 'public'

UNION ALL

-- Check existing triggers
SELECT 'TRIGGERS', COUNT(*)::text
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

-- Check existing policies
SELECT 'RLS POLICIES', COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================
-- List all existing tables
-- ============================================

SELECT
    '→ ' || table_name as existing_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
