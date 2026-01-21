# Database Migration Guide

## Overview
This guide explains how to apply the database migration that unifies the customer tables and fixes the database structure.

## Migration File
- **Location**: `supabase/migrations/unify_customer_tables.sql`
- **Purpose**: Creates a unified customer table structure with proper relationships and daily statistics tracking

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Open the migration file: `supabase/migrations/unify_customer_tables.sql`
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### Option 2: PostgreSQL Client

If you have direct PostgreSQL access:

```bash
psql -h <your-supabase-host> -U postgres -d postgres -f supabase/migrations/unify_customer_tables.sql
```

## What This Migration Does

### 1. Creates New Tables

- **`customers`**: Unified table for all customer data (combines `salam_customers` and `mobily_customers`)
- **`projects`**: Reference table for project types (Salam, Mobily)
- **`daily_customer_totals`**: Aggregated daily statistics per project

### 2. Data Migration

- Automatically migrates all existing data from `salam_customers` to the new `customers` table
- Automatically migrates all existing data from `mobily_customers` to the new `customers` table
- Populates `daily_customer_totals` with historical statistics

### 3. Creates Functions

- `check_customer_exists(identity_number, project)`: Check if a customer exists
- `get_daily_customer_count(project)`: Get today's customer count for a project
- `get_salam_daily_count()`: Backward compatible function for Salam daily count
- `get_mobily_daily_count()`: Backward compatible function for Mobily daily count
- `update_daily_totals()`: Trigger function to auto-update daily statistics

### 4. Row Level Security (RLS)

- Users can only view/edit their own customers
- Admins can view/edit all customers
- All authenticated users can view projects and daily totals

### 5. Triggers

- Auto-updates `updated_at` timestamp on all tables
- Auto-updates `daily_customer_totals` when customers are added/modified/deleted

## New Database Structure

### Unified Customers Table

```sql
customers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  created_by_username TEXT,

  -- Common fields
  full_name TEXT NOT NULL,
  identity_number TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  sim_number TEXT NOT NULL,
  device_number TEXT NOT NULL,
  nationality TEXT NOT NULL,
  register_number TEXT NOT NULL,

  -- Project identification
  project ENUM('salam', 'mobily') NOT NULL,
  supervisor_name TEXT,
  status TEXT DEFAULT 'active',

  -- Mobily-specific fields (nullable for Salam)
  birth_date TEXT,
  identity_expiry_date TEXT,
  package TEXT,
  email TEXT,
  city TEXT,
  district TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE (identity_number, project),
  UNIQUE (sim_number, project)
)
```

### Projects Table

```sql
projects (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,
  code ENUM('salam', 'mobily') UNIQUE,
  description TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### Daily Customer Totals

```sql
daily_customer_totals (
  id UUID PRIMARY KEY,
  date DATE,
  project ENUM('salam', 'mobily'),
  total_customers INTEGER,
  unique_users INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,

  UNIQUE (date, project)
)
```

## Verification Steps

After running the migration, verify it worked correctly:

### 1. Check Tables Created

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('customers', 'projects', 'daily_customer_totals');
```

Expected: 3 rows returned

### 2. Check Data Migration

```sql
-- Count customers by project
SELECT project, COUNT(*)
FROM customers
GROUP BY project;

-- Verify against old tables
SELECT 'salam' as project, COUNT(*) FROM salam_customers
UNION ALL
SELECT 'mobily' as project, COUNT(*) FROM mobily_customers;
```

The counts should match.

### 3. Check Daily Totals

```sql
SELECT * FROM daily_customer_totals
ORDER BY date DESC
LIMIT 10;
```

Should show aggregated statistics by date and project.

### 4. Test Functions

```sql
-- Test daily count function
SELECT get_daily_customer_count('salam');
SELECT get_daily_customer_count('mobily');

-- Test backward compatible functions
SELECT get_salam_daily_count();
SELECT get_mobily_daily_count();

-- Test customer existence check
SELECT check_customer_exists('123456789', 'salam');
```

## Backward Compatibility

The old tables (`salam_customers` and `mobily_customers`) are **NOT** dropped by this migration. They remain in the database for backward compatibility and as a backup.

Once you've verified that the migration worked correctly and the application is functioning properly with the new tables, you can optionally drop the old tables:

```sql
-- ONLY run this after thorough testing!
DROP TABLE IF EXISTS public.salam_customers CASCADE;
DROP TABLE IF EXISTS public.mobily_customers CASCADE;
```

## Rollback Plan

If you need to rollback the migration:

1. The old tables still exist, so you can continue using them
2. Drop the new tables:

```sql
DROP TABLE IF EXISTS public.daily_customer_totals CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TYPE IF EXISTS project_type CASCADE;
```

3. Revert the application code changes

## Next Steps

After applying the migration:

1. ✅ Verify the migration completed successfully
2. ✅ Test customer creation in both Salam and Mobily projects
3. ✅ Test the admin dashboard to ensure customer data is displayed
4. ✅ Test user creation
5. ✅ Monitor the application for any errors

## Troubleshooting

### Error: "relation already exists"

This means the migration has already been applied. You can either:
- Skip the migration if it's already complete
- Or drop the new tables and rerun the migration

### Error: "permission denied"

Make sure you're using the Service Role Key (not the anon key) when running the migration.

### No data in customers table

Check if data exists in the old tables:

```sql
SELECT COUNT(*) FROM salam_customers;
SELECT COUNT(*) FROM mobily_customers;
```

If data exists but wasn't migrated, the INSERT statements in the migration may have failed. Check for unique constraint violations.

## Support

For issues or questions, please review the migration SQL file and check the Supabase logs for detailed error messages.
