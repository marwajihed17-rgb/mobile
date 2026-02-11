# Supabase Database Setup Guide

Complete guide for setting up your Supabase database for the PAA Solutions Mobile Application.

## 📋 Prerequisites

- Supabase project created at [supabase.com](https://supabase.com)
- Supabase project URL and API keys (already configured in `.env.local`)
- Access to Supabase SQL Editor

## 🚀 Quick Setup (5 minutes)

### Step 1: Run the Complete Database Setup

1. Open your Supabase project dashboard
2. Go to **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy the entire content of `complete_database_setup.sql`
5. Paste it into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`

✅ This will create:
- All database tables
- Custom types (enums)
- Functions and triggers
- Row Level Security (RLS) policies
- Views for statistics
- Indexes for performance
- Default data (projects and operators)
- Realtime subscriptions

### Step 2: Create Your Super Admin User

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Click **Add user** → **Create new user**
3. Enter:
   - Email: `admin@retaam.app`
   - Password: Your secure password
   - Auto Confirm User: ✅ (checked)
4. Click **Create user**
5. Go back to **SQL Editor**
6. Run this query:
   ```sql
   UPDATE public.profiles
   SET role = 'super_admin', username = 'admin'
   WHERE email = 'admin@retaam.app';
   ```

**Option B: Via SQL Script**

1. In SQL Editor, open `create_super_admin.sql`
2. Modify the email and username as needed
3. Run the script

### Step 3: Setup Cron Jobs (Optional but Recommended)

1. In SQL Editor, open `setup_cron_jobs.sql`
2. Run the script to enable daily statistics reset at 00:30

### Step 4: Verify Setup

Run this verification query:
```sql
-- Check tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check admin user
SELECT id, email, username, role, status
FROM public.profiles
WHERE role = 'super_admin';

-- Check cron jobs
SELECT jobname, schedule, active
FROM cron.job;
```

## 📊 Database Schema Overview

### Core Tables

1. **profiles** - User accounts and roles
   - `id`, `email`, `username`, `full_name`
   - `role` (user, admin, super_admin, operator)
   - `status` (active, inactive, suspended)
   - `operator_id`, `activation_status`

2. **user_settings** - User preferences
   - `dashboard_access`, `admin_privileges`, `notifications_enabled`

3. **operators** - Operator management
   - `name`, `code`, `is_active`

4. **salam_customers** - Salam project customers
   - 8 core fields + operator assignment
   - `name`, `identity_number`, `phone_number`, `sim_number`
   - `device_number`, `nationality`, `register_number`, `package`
   - `operator_id`, `operator_name`, `activation_status`

5. **mobily_customers** - Mobily project customers
   - 14 core fields + operator assignment
   - Includes all Salam fields plus:
   - `birth_date`, `birth_date_calendar_type`
   - `identity_expiry_date`, `identity_expiry_date_calendar_type`
   - `email`, `city`, `district`, `price`

6. **projects** - Project definitions
   - `name`, `code`, `description`, `is_active`

7. **daily_customer_totals** - Daily statistics
   - `date`, `project`, `total_customers`, `unique_users`

8. **stats_daily_baseline** - Baseline for daily reset
   - `date`, `project`, `baseline_total`

### Custom Types (Enums)

- `user_role`: user, admin, super_admin, operator
- `user_status`: active, inactive, suspended
- `activation_status`: activated, activating, confirmed
- `project_type`: salam, mobily
- `calendar_type`: gregorian, hijri

### Key Functions

- `is_admin(user_id)` - Check if user is admin
- `is_operator(user_id)` - Check if user is operator
- `is_super_admin(user_id)` - Check if user is super admin
- `get_salam_daily_count()` - Get today's Salam count
- `get_mobily_daily_count()` - Get today's Mobily count
- `get_stats_baseline(project)` - Get baseline for project
- `record_daily_baseline()` - Record daily baseline (cron job)
- `get_stats_by_date_range(start, end)` - Get statistics by date range

### Views

- `salam_daily_stats` - Daily Salam statistics
- `mobily_daily_stats` - Daily Mobily statistics
- `daily_stats` - Combined daily statistics

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### Profiles
- Users can view own profile
- Admins can view all profiles
- All users can view operator profiles
- Users can update own profile (limited fields)
- Super admins can update any profile

### Customers (Salam & Mobily)
- Users can view own customers
- Admins can view all customers
- Operators can view customers with activation status
- Users can insert/update/delete own customers
- Admins can manage all customers
- Operators can update assigned customers

### Operators
- All authenticated users can view active operators
- Only admins can manage operators

### Projects & Statistics
- All authenticated users can view
- Only admins can modify

## 🔄 Realtime Subscriptions

Realtime is enabled for:
- `profiles`
- `salam_customers`
- `mobily_customers`
- `operators`
- `daily_customer_totals`
- `stats_daily_baseline`

## 📝 User Roles

### Super Admin
- Full access to everything
- Can manage all users
- Can modify any data
- Can delete users

### Admin
- Can view all data
- Can manage customers
- Can view user list
- Cannot delete users

### Operator (المشغل)
- Can view assigned customers
- Can update activation status
- Cannot view other users' data
- Cannot delete data

### User
- Can view own data only
- Can create/update/delete own customers
- Cannot view other users' data

## 🕐 Cron Jobs

### Daily Baseline Reset (00:30)
- Runs at 00:30 every day
- Records previous day's totals as baseline
- Enables cumulative statistics

To manually trigger:
```sql
SELECT public.record_daily_baseline();
```

## 🧪 Testing

### Test Admin Permissions
```sql
-- As admin user
SELECT * FROM public.profiles; -- Should see all users
SELECT * FROM public.salam_customers; -- Should see all customers
```

### Test Operator Permissions
```sql
-- As operator user
SELECT * FROM public.salam_customers
WHERE activation_status IN ('activating', 'activated'); -- Should see assigned customers
```

### Test Regular User Permissions
```sql
-- As regular user
SELECT * FROM public.salam_customers; -- Should only see own customers
```

## 🔧 Troubleshooting

### Issue: RLS Policies Not Working
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### Issue: Trigger Not Firing for New Users
```sql
-- Check if trigger exists
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### Issue: Cron Job Not Running
```sql
-- Check cron job status
SELECT * FROM cron.job WHERE jobname = 'daily-baseline-reset';

-- Check cron job history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 5;

-- Re-create cron job
SELECT cron.unschedule('daily-baseline-reset');
SELECT cron.schedule(
    'daily-baseline-reset',
    '30 0 * * *',
    $$SELECT public.record_daily_baseline()$$
);
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)

## 🎯 Next Steps

1. ✅ Database setup complete
2. ✅ Super admin created
3. ✅ Cron jobs configured
4. Test the application
5. Create additional users as needed
6. Monitor database performance
7. Set up backups (automatic in Supabase)

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review Supabase logs in the dashboard
- Check the application logs

---

**Database Version:** 1.0.0
**Last Updated:** 2026-02-11
**Compatible with:** Next.js 14.1.0, Supabase JS v2.39.0
