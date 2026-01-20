# Supabase Dashboard Integration - Setup Guide

This guide will help you set up the complete Supabase dashboard integration for the PAA Solutions application according to the provided documentation.

## Overview

The integration provides:
- ✅ Complete user management with username and supervisor_name tracking
- ✅ Project-based customer management (Salam & Mobily)
- ✅ Daily statistics with efficient database functions
- ✅ Real-time data filtering and validation
- ✅ Secure authentication with Row Level Security (RLS)
- ✅ Bidirectional data flow between frontend and Supabase

## Prerequisites

Before starting, ensure you have:
1. A Supabase project created at [supabase.com](https://supabase.com)
2. Your Supabase URL and keys in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Step 1: Set Up the Database

### ⚠️ IMPORTANT: Choose the Right File

**If you're getting an error like "relation 'public.profiles' does not exist"**, it means your database is empty. Follow **Option A**.

### Option A: Fresh/Empty Database (RECOMMENDED - START HERE)

If you have a **new or empty** Supabase project with no tables yet:

1. Go to your Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy and paste the contents of `/supabase/init_database.sql`
4. Click "Run" or press `Ctrl+Enter`
5. Wait for completion (should take 5-10 seconds)
6. Verify by checking Table Editor - you should see `profiles`, `salam_customers`, `mobily_customers` tables

**This file creates:**
- ✅ All tables (profiles, salam_customers, mobily_customers, etc.)
- ✅ All functions (get_salam_daily_count, get_mobily_daily_count, etc.)
- ✅ All views (salam_daily_stats, mobily_daily_stats, daily_stats_summary)
- ✅ All RLS policies
- ✅ All triggers and indexes

### Option B: Update Existing Database (Advanced)

**Only use this if you already have tables and just need updates:**

1. Go to your Supabase Dashboard → SQL Editor
2. Run `/supabase/migrations/dashboard_integration_complete.sql`
3. This adds missing columns and updates existing structure

### Option C: Complete Schema (Alternative)

You can also use the complete schema file:

1. Go to your Supabase Dashboard → SQL Editor
2. Run `/supabase/schema.sql`
3. This is comprehensive but includes extra tables you might not need

## Step 2: Verify Database Setup

After running the SQL, verify the setup by running these queries in the SQL Editor:

```sql
-- Check if profiles table has required columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('username', 'supervisor_name');

-- Check if customer tables have created_by_username
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('salam_customers', 'mobily_customers')
AND column_name = 'created_by_username';

-- Test statistics functions
SELECT public.get_salam_daily_count();
SELECT public.get_mobily_daily_count();

-- View statistics views
SELECT * FROM public.salam_daily_stats LIMIT 5;
SELECT * FROM public.mobily_daily_stats LIMIT 5;
SELECT * FROM public.daily_stats_summary LIMIT 5;
```

All queries should return results without errors.

## Step 3: Create an Admin User

You need at least one admin user to access the admin dashboard:

### Via Supabase Dashboard

1. Go to Authentication → Users
2. Click "Add user"
3. Fill in:
   - Email: `admin@example.com`
   - Password: (choose a secure password)
   - Auto Confirm User: Yes
4. After creating, go to Table Editor → profiles
5. Find the new user and set:
   - `role`: `super_admin`
   - `username`: `admin`
   - `supervisor_name`: `System Admin`
   - `status`: `active`

### Via SQL (Alternative)

```sql
-- First, create the auth user
-- (You'll need to do this via the Supabase Dashboard)

-- Then update their profile
UPDATE public.profiles
SET
  role = 'super_admin',
  username = 'admin',
  supervisor_name = 'System Admin',
  status = 'active'
WHERE email = 'admin@example.com';
```

## Step 4: Test the Application

### 1. Login Test

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Login"
4. Enter your admin credentials
5. You should be redirected to `/admin`

### 2. User Management Test

1. In Admin Dashboard, click "Settings" tab
2. Click "Add User" (➕ button)
3. Fill in:
   - Username: `testuser`
   - Supervisor Name: `Test Supervisor`
   - Password: `password123`
   - Email: `test@example.com`
4. Submit
5. Verify the user appears in the users table
6. Try updating the user's status (active/inactive)
7. Verify you can see username and supervisor_name displayed

### 3. Salam Customer Test

1. Login as a regular user (not admin)
2. Go to Dashboard → Salam Project
3. Fill in the customer form:
   - Full Name: `أحمد محمد`
   - Identity Number: `1234567890`
   - Phone Number: `0551234567`
   - SIM Number: `0551234567`
   - Device Number: `123456789012345`
   - Nationality: `سعودي`
   - Register Number: `REG-001`
4. Submit the form
5. Verify:
   - Success message appears
   - Real-time validation works (try entering the same identity number again)

### 4. Mobily Customer Test

1. Go to Dashboard → Mobily Project
2. Fill in all fields (including the 6 additional Mobily fields)
3. Submit and verify success

### 5. Admin Dashboard Test

1. Login as admin
2. Go to Admin Dashboard
3. Verify stats cards show:
   - Total Salam Customers (all-time count)
   - Total Mobily Customers (all-time count)
   - Daily Salam Users (today's count)
   - Daily Mobily Users (today's count)
4. Click "Salam" tab
5. Verify you can see:
   - All customers from all users
   - Creator username for each customer
   - Search and date filtering works
6. Repeat for "Mobily" tab

## Step 5: Verify RLS Policies

Row Level Security ensures data isolation. Test this:

### As Regular User:
```sql
-- Login as regular user, then run:
SELECT * FROM salam_customers;
-- Should only see your own customers
```

### As Admin:
```sql
-- Login as admin, then run:
SELECT * FROM salam_customers;
-- Should see ALL customers from all users
```

## Troubleshooting

### Issue: "No data showing in admin dashboard"

**Solution:**
1. Check if you're logged in as admin:
   ```sql
   SELECT role FROM profiles WHERE email = 'your-email';
   ```
2. Verify RLS policies are set up correctly:
   ```sql
   SELECT tablename, policyname
   FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename IN ('salam_customers', 'mobily_customers');
   ```

### Issue: "Username already exists" when creating users

**Solution:**
- The username field is unique. Choose a different username.
- To check existing usernames:
  ```sql
  SELECT username FROM profiles ORDER BY username;
  ```

### Issue: "Identity number/SIM number already exists"

**Solution:**
- These fields are unique per project to prevent duplicates.
- This is intentional behavior for data integrity.
- Use the search feature in admin dashboard to find the existing record.

### Issue: "Daily counts showing 0"

**Solution:**
1. Verify customers were created today:
   ```sql
   SELECT DATE(created_at), COUNT(*)
   FROM salam_customers
   GROUP BY DATE(created_at)
   ORDER BY DATE(created_at) DESC;
   ```
2. Check if functions are returning correct results:
   ```sql
   SELECT public.get_salam_daily_count();
   ```

### Issue: "Statistics functions not found"

**Solution:**
Run the migration file again:
```sql
-- Re-run: /supabase/migrations/dashboard_integration_complete.sql
```

## Database Schema Reference

### Key Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `profiles` | User accounts | id, email, username (unique), supervisor_name, role, status |
| `salam_customers` | Salam project records | id, user_id, created_by_username, name, identity_number (unique), sim_number (unique) |
| `mobily_customers` | Mobily project records | Same as Salam + 6 additional fields |

### Key Functions

| Function | Return Type | Description |
|----------|-------------|-------------|
| `get_salam_daily_count()` | INTEGER | Count of Salam customers created today |
| `get_mobily_daily_count()` | INTEGER | Count of Mobily customers created today |
| `get_stats_by_date_range(start, end)` | TABLE | Historical statistics for date range |
| `check_salam_customer_exists(identity)` | BOOLEAN | Check if Salam customer exists |
| `check_mobily_customer_exists(identity)` | BOOLEAN | Check if Mobily customer exists |

### Key Views

| View | Description |
|------|-------------|
| `salam_daily_stats` | Daily statistics for Salam project |
| `mobily_daily_stats` | Daily statistics for Mobily project |
| `daily_stats_summary` | Combined daily statistics for both projects |

## Security Best Practices

1. **Never expose Service Role Key**: Keep it in `.env.local` and never commit to Git
2. **Use RLS**: All tables have RLS enabled to protect data
3. **Admin endpoints**: Protected by role checking in both API and database
4. **Password requirements**: Minimum 8 characters enforced
5. **Unique constraints**: Prevent duplicate identity numbers and SIM numbers

## API Endpoints

### Admin User Management

```typescript
// Create User
POST /api/admin/create-user
Body: {
  username: string,
  email: string,
  supervisor_name: string,
  password: string
}

// Delete User
DELETE /api/admin/delete-user
Body: { userId: string }
```

### Customer Operations

All customer operations use Supabase client directly:
```typescript
// Create Salam customer
supabase.from('salam_customers').insert({
  user_id,
  created_by_username,
  ...customerData
})

// Get all customers (admin)
supabase.from('salam_customers')
  .select('*, profiles(username, full_name, email)')

// Get daily count
supabase.rpc('get_salam_daily_count')
```

## Performance Optimization

The integration uses several optimizations:

1. **Database Functions**: Statistics calculated in PostgreSQL (faster than client-side)
2. **Indexes**: All foreign keys and frequently queried fields are indexed
3. **Views**: Pre-computed daily statistics for fast access
4. **RLS**: Security enforced at database level (no additional API calls)

## Next Steps

After successful setup:

1. **Create more users**: Use admin dashboard to add team members
2. **Enter test data**: Create sample customers in both projects
3. **Monitor statistics**: Check daily counts in admin dashboard
4. **Customize**: Modify forms or add fields as needed
5. **Deploy**: Follow deployment guide for production

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the main documentation: `/docs/SUPABASE_INTEGRATION.md`
- Check database logs in Supabase Dashboard → Logs
- Verify RLS policies are working correctly

---

**✅ Setup Complete!**

Your Supabase dashboard integration is now ready for use. All features including user management, customer tracking, and daily statistics are fully functional.
