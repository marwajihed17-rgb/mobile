# Quick Database Setup - Fix "relation does not exist" Error

## 🚨 You're seeing this error:
```
ERROR: 42P01: relation "public.profiles" does not exist
```

This means your Supabase database is empty and needs to be initialized.

## ✅ Solution: Run the Initialization Script

### Step 1: Open Supabase SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**

### Step 2: Run the Initialization Script

1. Open the file: **`supabase/init_database.sql`** from your project
2. **Copy ALL the contents** (Ctrl+A, Ctrl+C)
3. **Paste** into the Supabase SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait 5-10 seconds for completion

You should see:
```
Success. No rows returned
```

### Step 3: Verify Tables Were Created

1. Click on **"Table Editor"** in the left sidebar
2. You should now see these tables:
   - ✅ profiles
   - ✅ salam_customers
   - ✅ mobily_customers
   - ✅ user_settings
   - ✅ module_access
   - ✅ audit_logs

### Step 4: Create Your First Admin User

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Fill in:
   - **Email**: `admin@example.com` (or your email)
   - **Password**: Choose a secure password
   - **Auto Confirm User**: ✅ **YES** (important!)
4. Click **"Create user"**

### Step 5: Make the User an Admin

1. Go to **Table Editor** → **profiles** table
2. Find your user (look for the email you just created)
3. Click on the row to edit it
4. Set these values:
   - **role**: `super_admin`
   - **username**: `admin` (or any username you want)
   - **supervisor_name**: `System Admin` (or any name)
   - **status**: `active`
5. Click **"Save"**

### Step 6: Test Your Application

1. Start your dev server: `npm run dev`
2. Open `http://localhost:3000`
3. Click **"Login"**
4. Enter the email and password you created
5. You should be redirected to **`/admin`** (Admin Dashboard)

## 🎉 Done!

Your database is now fully set up and ready to use!

---

## What This Script Does

The `init_database.sql` script creates:

1. **Tables**:
   - `profiles` - User accounts with username and supervisor
   - `salam_customers` - Salam project customer data
   - `mobily_customers` - Mobily project customer data
   - Supporting tables for settings, modules, and audit logs

2. **Functions**:
   - `get_salam_daily_count()` - Get today's Salam customer count
   - `get_mobily_daily_count()` - Get today's Mobily customer count
   - `get_stats_by_date_range()` - Get historical statistics
   - `is_admin()` - Check if user is admin
   - `handle_new_user()` - Auto-create profile when user signs up

3. **Views**:
   - `salam_daily_stats` - Daily Salam statistics
   - `mobily_daily_stats` - Daily Mobily statistics
   - `daily_stats_summary` - Combined daily statistics

4. **Security**:
   - Row Level Security (RLS) policies on all tables
   - Users can only see their own data
   - Admins can see all data
   - Triggers to auto-update timestamps

---

## Troubleshooting

### "I don't see the tables after running the script"

**Solution**: Refresh your browser or click on a different section and come back to Table Editor.

### "I can't login even after creating the user"

**Solution**:
1. Make sure you set **Auto Confirm User** to YES when creating the user
2. Check that the user's **status** in profiles table is `active`
3. Verify the **role** is set to `super_admin` or `admin`

### "I get permission denied errors"

**Solution**:
1. Check that you're using the correct **SUPABASE_ANON_KEY** in `.env.local`
2. Verify RLS policies were created - go to Table Editor → select a table → click "RLS disabled/enabled" button to see policies

### "The admin dashboard shows 0 customers"

**Solution**:
- This is normal if you just set up the database
- Create some test customers via the Salam or Mobily project pages
- The counts will update automatically

---

## Need More Help?

- Full documentation: `docs/SUPABASE_DASHBOARD_SETUP.md`
- Check database logs: Supabase Dashboard → Logs → Postgres Logs
- Verify environment variables in `.env.local`
