# Supabase Database Rebuild Guide

## 🎯 Overview

This guide explains how to rebuild your entire Supabase database from scratch after it was deleted. The database includes all tables, functions, triggers, views, RLS policies, and storage configurations needed for the PAA Solutions application.

---

## 📋 What's Included

### Core Tables (14 total)
1. **profiles** - User management with role-based access control
2. **user_settings** - Per-user preferences and settings
3. **module_access** - Granular module-level permissions
4. **customers** - **Main unified table** for all customer data (Salam & Mobily)
5. **projects** - Available projects (Salam, Mobily)
6. **daily_customer_totals** - Automated daily statistics
7. **salam_customers** - Legacy Salam customers (backward compatibility)
8. **mobily_customers** - Legacy Mobily customers (backward compatibility)
9. **salam_entries** - Legacy entries table
10. **mobily_entries** - Legacy entries table
11. **chat_messages** - User-module chat history
12. **file_uploads** - File tracking and metadata
13. **audit_logs** - Complete audit trail
14. **module_access** - Module permissions

### Database Functions (20+)
- **Authentication**: `is_admin()`, `is_super_admin()`, `get_user_modules()`
- **User Management**: `handle_new_user()`, `log_audit_event()`
- **Customer Checks**: `check_customer_exists()`, `check_salam_exists()`, etc.
- **Statistics**: `get_daily_customer_count()`, `get_customer_stats_by_date_range()`
- **Utilities**: `update_updated_at_column()`, `update_daily_totals()`

### Database Views (5)
- **daily_stats** - Consolidated daily statistics
- **customers_with_users** - Customers with user profile info
- **salam_daily_stats** - Legacy Salam statistics
- **mobily_daily_stats** - Legacy Mobily statistics
- **daily_stats_summary** - Legacy combined statistics

### Triggers (12)
- Automatic timestamp updates on all tables
- User profile creation on signup
- Daily statistics updates

### RLS Policies (40+)
- Complete row-level security on all tables
- Role-based access control (user, admin, super_admin)
- User-level data isolation

### Storage Buckets (2)
- **uploads** - Private bucket for user file uploads
- **avatars** - Public bucket for user avatars

### Custom Types (4 Enums)
- `user_role`: 'user', 'admin', 'super_admin'
- `user_status`: 'active', 'inactive', 'suspended'
- `module_type`: 'invoice', 'kdr', 'ga', 'kdr_inv', 'kdr_sellout'
- `project_type`: 'salam', 'mobily'

---

## 🚀 How to Rebuild the Database

### Method 1: Using the Complete Rebuild Script (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project: https://app.supabase.com
   - Navigate to the SQL Editor

2. **Load the Rebuild Script**
   - Open the file: `supabase/rebuild_database.sql`
   - Copy the entire contents (all 1400+ lines)

3. **Execute the Script**
   - Paste the script into the SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for the script to complete (typically 5-10 seconds)

4. **Verify Success**
   - Check the output panel for the success message
   - You should see a summary of created objects:
     - Tables: 14
     - Functions: 20+
     - Triggers: 12
     - Views: 5
     - RLS Policies: 40+

### Method 2: Using the Original Schema

Alternatively, you can use the original schema file:
- File: `supabase/schema.sql`
- This contains the same structure but without seed data

---

## 🔐 Post-Rebuild Setup

### Step 1: Create Your First Admin User

You need to create a super admin user to access the admin dashboard:

1. **Via Supabase Dashboard:**
   - Go to Authentication → Users
   - Click "Add user" → "Create new user"
   - Enter email and password
   - Click "Create user"

2. **Upgrade to Super Admin:**
   ```sql
   -- Run this in SQL Editor, replace with your user's email
   UPDATE public.profiles
   SET role = 'super_admin'
   WHERE email = 'your-admin-email@example.com';
   ```

### Step 2: Verify Database Structure

Run this query to check all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected tables:
- audit_logs
- chat_messages
- customers ✨ (main table)
- daily_customer_totals
- file_uploads
- mobily_customers
- mobily_entries
- module_access
- profiles
- projects
- salam_customers
- salam_entries
- user_settings

### Step 3: Test the Application

1. **Login Test**
   - Try logging in with your admin user
   - Verify you can access the dashboard

2. **Admin Dashboard Test**
   - Navigate to `/admin`
   - Check all four tabs:
     - Dashboard (statistics)
     - Salam Project
     - Mobily Project
     - User Management

3. **User Creation Test**
   - Try creating a new user from the admin panel
   - Verify the user appears in the users list
   - Check that default permissions are granted

---

## 📊 Database Architecture

### Unified Customer Structure

The database uses a **unified customer table** (`customers`) that handles both Salam and Mobily projects:

```sql
-- Structure
customers (
  -- Common fields (all projects)
  full_name, identity_number, phone_number,
  sim_number, device_number, nationality, register_number,

  -- Project identification
  project (salam | mobily),

  -- Mobily-specific (nullable for Salam)
  birth_date, identity_expiry_date, package,
  email, city, district
)
```

### Role-Based Access Control

Three user roles with different permissions:

1. **User** (default)
   - View own data only
   - Add/edit/delete own customers
   - Access assigned modules

2. **Admin**
   - View all data
   - Manage all customers
   - View audit logs
   - Cannot manage users

3. **Super Admin**
   - Full system access
   - User management
   - System configuration
   - All admin permissions

### Automatic Features

1. **User Creation**
   - Profile automatically created on signup
   - Default settings applied
   - All modules granted by default

2. **Statistics Tracking**
   - Daily totals automatically calculated
   - Triggers update on every customer change
   - Historical data maintained

3. **Audit Logging**
   - All admin actions logged
   - User actions tracked
   - Complete audit trail

---

## 🔍 Verification Queries

### Check Total Users
```sql
SELECT role, status, COUNT(*) as count
FROM public.profiles
GROUP BY role, status
ORDER BY role;
```

### Check Total Customers
```sql
SELECT project, COUNT(*) as count
FROM public.customers
GROUP BY project;
```

### Check Today's Statistics
```sql
SELECT * FROM public.daily_stats
WHERE date = CURRENT_DATE;
```

### Check Storage Buckets
```sql
SELECT id, name, public
FROM storage.buckets;
```

### Check RLS Policies
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 🐛 Troubleshooting

### Problem: "Function already exists" errors

**Solution:** The script includes `CREATE OR REPLACE` for functions, so this shouldn't happen. If it does:
```sql
-- Drop and recreate
DROP FUNCTION IF EXISTS function_name CASCADE;
-- Then re-run the script
```

### Problem: "Policy already exists" errors

**Solution:** The script includes `DROP POLICY IF EXISTS` before creating policies. If you see this:
```sql
-- Manually drop the policy
DROP POLICY IF EXISTS "policy_name" ON table_name;
-- Then re-run the relevant section
```

### Problem: User creation fails

**Solution:** Check the trigger is working:
```sql
-- Verify trigger exists
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- If missing, recreate it:
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### Problem: Can't access admin dashboard

**Solution:** Verify user role:
```sql
-- Check your role
SELECT email, role, status
FROM public.profiles
WHERE email = 'your-email@example.com';

-- If not super_admin, update it:
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'your-email@example.com';
```

### Problem: Storage uploads fail

**Solution:** Check storage policies:
```sql
-- List all storage policies
SELECT * FROM storage.policies;

-- If missing, the rebuild script includes them
-- Re-run Section 12 of the rebuild script
```

---

## 📝 Important Notes

### Data Migration

If you have backup data to restore:

1. **Import Users First**
   ```sql
   -- Users must exist in auth.users first
   -- Then profiles will be created automatically
   ```

2. **Import Customers**
   ```sql
   -- Use the unified customers table
   INSERT INTO public.customers (...)
   VALUES (...);
   ```

3. **Update Statistics**
   ```sql
   -- Statistics will auto-calculate via triggers
   -- Or manually run:
   SELECT public.update_daily_totals();
   ```

### Backward Compatibility

The database maintains legacy tables for backward compatibility:
- `salam_customers` / `mobily_customers`
- `salam_entries` / `mobily_entries`

**New development should use the unified `customers` table.**

### Performance

The database includes 30+ indexes for optimal performance:
- All foreign keys are indexed
- Search fields are indexed (identity_number, sim_number)
- Timestamp fields are indexed for sorting
- Project fields are indexed for filtering

---

## 📚 Additional Resources

### SQL Files in This Directory

1. **rebuild_database.sql** ⭐ (Use this!)
   - Complete database rebuild from scratch
   - Includes all objects and seed data
   - Production-ready with documentation

2. **schema.sql**
   - Original complete schema
   - Alternative to rebuild script

3. **migrations/final_database_fix.sql**
   - Migration from old structure
   - Only use if upgrading existing database

### Application Integration

The database is designed to work with:
- Next.js 14 application
- TypeScript types in `/src/types/database.ts`
- Supabase client configuration
- Row Level Security (RLS)

---

## ✅ Success Checklist

After rebuilding, verify:

- [ ] All 14 tables created
- [ ] All functions working (20+)
- [ ] All triggers active (12)
- [ ] All views accessible (5)
- [ ] RLS policies enabled (40+)
- [ ] Storage buckets created (2)
- [ ] Default projects inserted (Salam, Mobily)
- [ ] Super admin user created
- [ ] Can login to application
- [ ] Admin dashboard accessible
- [ ] Can create new users
- [ ] Statistics are calculating
- [ ] Audit logs are working

---

## 🆘 Need Help?

If you encounter issues:

1. Check the error message in SQL Editor
2. Review the Troubleshooting section above
3. Verify each section executed successfully
4. Check Supabase logs for runtime errors
5. Ensure you're using the latest script version

---

## 🎉 Conclusion

Your database is now fully rebuilt and ready for production! The architecture is:
- ✅ Secure (RLS enabled everywhere)
- ✅ Scalable (proper indexes)
- ✅ Maintainable (clear structure)
- ✅ Auditable (complete logging)
- ✅ Production-ready

You can now start using the application with confidence!
