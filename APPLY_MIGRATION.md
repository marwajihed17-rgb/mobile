# How to Apply the Database Migration

## Overview

This guide explains how to apply the new unified database structure to your Supabase project.

## Prerequisites

- Access to your Supabase project dashboard
- Admin/Owner permissions on the project

## Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (`design-cellular`)
3. Navigate to **SQL Editor** in the left sidebar

## Step 2: Run the Migration

### Option A: Run the Complete Migration File

1. Open the file: `supabase/migrations/unify_customer_tables.sql`
2. Copy the entire content
3. Paste it into the SQL Editor
4. Click **Run** or press `Ctrl+Enter` / `Cmd+Enter`

### Option B: Run the Updated Schema File

If you prefer to recreate everything from scratch:

1. **IMPORTANT**: This will drop and recreate all tables. Only do this if you're sure!
2. Open the file: `supabase/schema.sql`
3. Copy the entire content
4. Paste it into the SQL Editor
5. Click **Run**

## Step 3: Verify the Migration

After running the migration, verify it succeeded by running these queries:

### 1. Check that new tables exist

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'projects', 'daily_customer_totals')
ORDER BY table_name;
```

**Expected result**: You should see 3 rows:
- customers
- daily_customer_totals
- projects

### 2. Check data was migrated

```sql
-- Check customer counts by project
SELECT
    project,
    COUNT(*) as count
FROM customers
GROUP BY project
ORDER BY project;
```

**Expected result**: You should see counts for 'mobily' and 'salam' matching your old data.

### 3. Check the profiles table has created_by fields

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('created_by_id', 'created_by_username')
ORDER BY column_name;
```

**Expected result**: Both columns should exist.

### 4. Test the new functions

```sql
-- Test daily count function
SELECT get_daily_customer_count('salam'::project_type) as salam_today;
SELECT get_daily_customer_count('mobily'::project_type) as mobily_today;

-- Test backward compatible functions
SELECT get_salam_daily_count();
SELECT get_mobily_daily_count();
```

## Step 4: Populate Projects Table

The migration should have automatically inserted the default projects. Verify with:

```sql
SELECT * FROM projects ORDER BY code;
```

You should see:
- سلام (Salam)
- موبايلي (Mobily)

If not, run:

```sql
INSERT INTO public.projects (name, code, description, is_active)
VALUES
    ('سلام', 'salam', 'مشروع سلام للاتصالات', true),
    ('موبايلي', 'mobily', 'مشروع موبايلي للاتصالات', true)
ON CONFLICT (code) DO NOTHING;
```

## Step 5: Test User Creation

Try creating a new user through the admin interface to ensure the `handle_new_user()` function works correctly with the updated fields.

## Troubleshooting

### Error: "type project_type already exists"

This is normal if you run the migration multiple times. The migration handles this with `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN null; END $$;`

### Error: "relation customers already exists"

The migration uses `CREATE TABLE IF NOT EXISTS`, so this should not happen. If it does, the table already exists and you can skip that part.

### Error: "duplicate key value violates unique constraint"

This means data migration tried to insert duplicate records. This is handled with `ON CONFLICT DO NOTHING` in the migration, so it should be safe.

### No data in customers table

Run this to manually copy data:

```sql
-- Check old tables first
SELECT COUNT(*) FROM salam_customers;
SELECT COUNT(*) FROM mobily_customers;

-- If data exists in old tables, run the INSERT statements from the migration
-- (see lines 100-180 in unify_customer_tables.sql)
```

## Post-Migration Checklist

After applying the migration and verifying it works:

- [ ] New tables created: `customers`, `projects`, `daily_customer_totals`
- [ ] Data migrated from old tables to new tables
- [ ] Daily totals populated with historical data
- [ ] Functions working correctly
- [ ] RLS policies in place
- [ ] Triggers working (test by inserting a new customer)
- [ ] User creation works (creates profile with role and created_by fields)

## Optional: Clean Up Old Tables

**⚠️ WARNING**: Only do this after thoroughly testing the new structure!

Once you've confirmed everything works with the new unified structure, you can optionally remove the old tables:

```sql
-- BACKUP YOUR DATA FIRST!
-- Run this only after extensive testing!

DROP TABLE IF EXISTS public.salam_entries CASCADE;
DROP TABLE IF EXISTS public.mobily_entries CASCADE;
DROP TABLE IF EXISTS public.salam_customers CASCADE;
DROP TABLE IF EXISTS public.mobily_customers CASCADE;
```

## Need Help?

If you encounter issues:

1. Check the Supabase logs for detailed error messages
2. Review the migration file to understand what it's doing
3. Verify your Supabase project has the latest schema
4. Check that RLS policies are properly configured

## Next Steps

After successfully applying the migration:

1. Test customer creation in both Salam and Mobily projects
2. Test the admin dashboard to view customer data
3. Test user creation
4. Verify daily statistics are being tracked correctly
5. Monitor the application for any errors
