# Admin Dashboard Data Display Fix

## Problem
The admin dashboard is not displaying customer data from the database.

## Root Causes Identified

1. **RLS (Row Level Security) Policies**: Ensure admin users have proper access to view all customer records
2. **Database Queries**: Verify queries are correctly fetching and joining data with the profiles table
3. **Error Handling**: Added proper error logging to identify issues

## Solutions Applied

### 1. Enhanced Error Handling (✅ Completed)
**File**: `src/app/(protected)/admin/page.tsx`

Added comprehensive error handling and logging:
- Error checking for all database queries
- Console logging to track data fetching
- Debug information for troubleshooting

### 2. Database Migration for Admin Access (✅ Created)
**File**: `supabase/migrations/fix_admin_access.sql`

This migration:
- Verifies the `is_admin()` function works correctly
- Recreates RLS policies to ensure admins can view ALL customer records
- Grants proper permissions on database functions
- Ensures RLS is enabled on customer tables

### 3. Client-Side Debugging (✅ Completed)
**File**: `src/app/(protected)/admin/admin-client.tsx`

Added debug logging to track:
- Number of customers received from server
- Current user role
- Statistics data

## How to Apply the Fix

### Step 1: Apply the Database Migration

You need to run the SQL migration to fix RLS policies. Choose one of these methods:

#### Option A: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

#### Option B: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/fix_admin_access.sql`
4. Paste and run it in the SQL Editor

#### Option C: Direct SQL Execution
```bash
# If you have direct database access
psql your_database_url < supabase/migrations/fix_admin_access.sql
```

### Step 2: Verify Your Admin User Role

Ensure your user has the correct role in the database:

```sql
-- Check your user's role
SELECT id, email, role, status FROM profiles WHERE email = 'your-admin-email@example.com';

-- If needed, update the role to admin
UPDATE profiles
SET role = 'admin', status = 'active'
WHERE email = 'your-admin-email@example.com';
```

### Step 3: Check the Console Logs

After applying the fix:
1. Open your browser's Developer Console (F12)
2. Navigate to the admin dashboard
3. Check for these log messages:
   - "Admin Dashboard Data:" - Shows what was fetched from database
   - "AdminClient received data:" - Shows what the component received
   - Any error messages starting with "Error fetching..."

### Step 4: Verify Data Exists in Database

Make sure you actually have customer data:

```sql
-- Check if there are any salam customers
SELECT COUNT(*) FROM salam_customers;

-- Check if there are any mobily customers
SELECT COUNT(*) FROM mobily_customers;

-- View sample data
SELECT * FROM salam_customers LIMIT 5;
SELECT * FROM mobily_customers LIMIT 5;
```

## Database Schema Overview

### Customer Tables Structure

#### salam_customers
- `id` (UUID)
- `user_id` (UUID) → Foreign key to profiles(id)
- `created_by_username` (TEXT) - Username of who created the record
- Customer fields: name, identity_number, phone_number, sim_number, device_number, nationality, register_number
- Timestamps: created_at, updated_at

#### mobily_customers
- All fields from salam_customers PLUS:
- `birth_date`, `identity_expiry_date`, `package`, `email`, `city`, `district`

### RLS Policies

Both customer tables have these policies:
1. **Users can view their own records**: `auth.uid() = user_id`
2. **Admins can view ALL records**: `is_admin(auth.uid())`

The `is_admin()` function returns true if the user's role is 'admin' or 'super_admin' AND status is 'active'.

## Troubleshooting

### If you still don't see data:

1. **Check Browser Console** for error messages
2. **Verify admin role**:
   ```sql
   SELECT * FROM profiles WHERE id = auth.uid();
   ```
3. **Test the is_admin function**:
   ```sql
   SELECT is_admin(auth.uid());
   -- Should return true for admin users
   ```
4. **Check if RLS is blocking**:
   ```sql
   -- Temporarily disable RLS to test (DON'T DO THIS IN PRODUCTION!)
   ALTER TABLE salam_customers DISABLE ROW LEVEL SECURITY;
   ALTER TABLE mobily_customers DISABLE ROW LEVEL SECURITY;

   -- Try accessing data, then re-enable RLS:
   ALTER TABLE salam_customers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE mobily_customers ENABLE ROW LEVEL SECURITY;
   ```

### Common Issues:

1. **"No data displayed"**:
   - Check if data exists in the database
   - Verify your user role is 'admin' or 'super_admin'
   - Ensure status is 'active'

2. **"Permission denied"**:
   - RLS policies might be blocking access
   - Apply the migration to fix policies
   - Verify the is_admin function works

3. **"profiles is not defined"**:
   - The foreign key relationship might be broken
   - Check that all customer records have valid user_id values

## Testing

After applying the fixes, test these scenarios:

1. ✅ Admin user can see all customer records
2. ✅ Clicking "مشروع سلام" shows all Salam customers
3. ✅ Clicking "مشروع موبايلي" shows all Mobily customers
4. ✅ All customer columns are displayed
5. ✅ User information (created_by) is shown correctly
6. ✅ Search and filter work properly
7. ✅ Switching between views happens instantly (no page reload)

## Next Steps

If issues persist after applying these fixes:
1. Check the server console logs (not just browser console)
2. Verify Supabase project settings
3. Ensure the database URL in `.env` is correct
4. Check for any CORS or network issues
