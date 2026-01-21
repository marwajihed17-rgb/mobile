# Customers Table Migration Guide

This document explains the new unified customers table and how to migrate your database.

## Overview

A new unified `customers` table has been added to replace the separate `salam_entries` and `mobily_entries` tables. This provides:

- **Unified customer data storage** across all projects
- **Better organization** with a `project_type` field to distinguish between projects
- **Consistent data structure** with all detailed fields
- **Improved querying** with optimized indexes

## Database Changes

### New Table: `customers`

The `customers` table includes:

**Common Fields (all projects):**
- `name` - Customer name
- `identity_number` - Identity/ID number (unique per project)
- `phone_number` - Phone number
- `sim_number` - SIM card number
- `device_number` - Device/IMEI number
- `nationality` - Nationality
- `register_number` - Register number

**Mobily-specific Fields:**
- `birth_date` - Date of birth
- `identity_expiry_date` - ID expiry date
- `package` - Package type
- `email` - Email address
- `city` - City
- `district` - District

**System Fields:**
- `id` - UUID primary key
- `user_id` - Reference to the user who created the entry
- `project_type` - Either 'salam' or 'mobily'
- `created_at` - Timestamp of creation
- `updated_at` - Timestamp of last update

### New Enum Type: `project_type`

```sql
CREATE TYPE project_type AS ENUM ('salam', 'mobily');
```

## Migration Steps

### Step 1: Run the Migration SQL

Execute the migration file in your Supabase SQL Editor:

```bash
# File location
supabase/migrations/create_customers_table.sql
```

**OR** run it directly in Supabase Dashboard:
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/create_customers_table.sql`
4. Execute the SQL

### Step 2: Verify the Migration

After running the migration, verify that:

1. The `customers` table exists
2. The `project_type` enum exists
3. All indexes are created
4. RLS policies are in place

You can check by running:

```sql
-- Check if table exists
SELECT * FROM information_schema.tables
WHERE table_name = 'customers';

-- Check if enum exists
SELECT * FROM pg_type
WHERE typname = 'project_type';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'customers';
```

### Step 3: Deploy the Application

Once the database migration is complete, deploy the updated application code. The forms will now save data to the `customers` table.

## What Changed in the Application

### Forms
- **Salam Form** (`/salam`) now saves to `customers` table with `project_type = 'salam'`
- **Mobily Form** (`/mobily`) now saves to `customers` table with `project_type = 'mobily'`

### Dashboard
- **Recent Entries** now displays data from the `customers` table
- Shows **last 5 customers** per project (changed from 10)
- Displays **all detailed fields** in the table view

### Type Definitions
- New `Customer` interface added to `src/types/database.ts`
- New `ProjectType` enum added

## Data Migration (Optional)

If you have existing data in `salam_entries` or `mobily_entries` tables and want to migrate it to the new `customers` table, you can run:

```sql
-- Migrate existing Salam entries
INSERT INTO customers (
    user_id, project_type, name, identity_number, phone_number,
    sim_number, device_number, nationality, register_number,
    created_at, updated_at
)
SELECT
    user_id, 'salam'::project_type, name, identity_number, phone_number,
    sim_number, device_number, nationality, register_number,
    created_at, updated_at
FROM salam_entries
ON CONFLICT (identity_number, project_type) DO NOTHING;

-- Migrate existing Mobily entries
INSERT INTO customers (
    user_id, project_type, name, identity_number, phone_number,
    sim_number, device_number, nationality, register_number,
    birth_date, identity_expiry_date, package, email, city, district,
    created_at, updated_at
)
SELECT
    user_id, 'mobily'::project_type, name, identity_number, phone_number,
    sim_number, device_number, nationality, register_number,
    birth_date, identity_expiry_date, package, email, city, district,
    created_at, updated_at
FROM mobily_entries
ON CONFLICT (identity_number, project_type) DO NOTHING;
```

**Note:** The old tables (`salam_entries` and `mobily_entries`) are kept for backward compatibility. You can drop them after verifying the migration is successful and all data is properly migrated.

## Features

### Recent Entries View
- Click "الإدخالات الأخيرة" (Recent Entries) on the dashboard
- View the **last 5 customers** for each project
- See **all detailed fields** in a comprehensive table view
- Delete customers directly from the table

### Data Organization
- Each customer is saved under the correct project (`salam` or `mobily`)
- Identity numbers are unique per project (same ID can exist in both projects)
- All data is properly indexed for fast queries

## Troubleshooting

### Error: "relation 'customers' does not exist"
- Make sure you ran the migration SQL in Supabase
- Verify the table was created using the verification query above

### Error: "type 'project_type' does not exist"
- The enum type needs to be created before the table
- Re-run the migration SQL from the beginning

### RLS Policy Errors
- Ensure you're logged in when testing
- Check that RLS is enabled on the `customers` table
- Verify the policies were created correctly

## Support

If you encounter any issues with the migration, check:
1. Supabase logs for SQL errors
2. Browser console for frontend errors
3. Network tab to see API responses

For additional help, refer to:
- Supabase Documentation: https://supabase.com/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/
