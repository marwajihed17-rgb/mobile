# 🚀 Quick Start: Supabase Database Setup

## ⚠️ IMPORTANT: Run This FIRST!

Before creating any users, you MUST initialize the database schema.

---

## Step 1: Initialize Database Schema

### 1.1 Access Supabase SQL Editor

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in and select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"**

### 1.2 Run the Initialization Script

1. **Open the schema file**: `supabase/init_database.sql` from your project
2. **Copy ALL contents** of the file (590 lines)
3. **Paste** into the Supabase SQL Editor
4. **Click "Run"** (or press Ctrl/Cmd + Enter)

### 1.3 Verify Success

You should see output like:
```
Success. No rows returned
```

Or at the bottom, you should see the verification query results showing the created tables.

**Run this verification query:**
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'salam_customers', 'mobily_customers', 'user_settings')
ORDER BY table_name;
```

**Expected result**: You should see 4 tables listed:
- mobily_customers
- profiles
- salam_customers
- user_settings

---

## Step 2: Create Your First Admin User

### 2.1 Create User in Supabase Authentication

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **"Add User"** button
3. Fill in:
   - **Email**: `admin@yourdomain.com`
   - **Password**: Create a strong password (min 8 characters)
   - ✅ Check **"Auto Confirm User"**
4. Click **"Create User"**
5. **IMPORTANT**: Copy the **User ID** (UUID) that appears

### 2.2 Promote User to Admin

**In the SQL Editor**, run one of these queries:

**Option A: By Email (Easiest)**
```sql
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE email = 'admin@yourdomain.com';
```

**Option B: By User ID (If trigger didn't create profile)**
```sql
-- First, check if profile was created automatically
SELECT id, email, username, role, status
FROM public.profiles
WHERE email = 'admin@yourdomain.com';

-- If no results, the trigger didn't fire. Create profile manually:
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    role,
    status
) VALUES (
    'PASTE_USER_ID_HERE',  -- Replace with the UUID from step 2.1
    'admin@yourdomain.com',
    'Admin User',
    'admin',  -- This will be the username for login
    'admin',  -- Role
    'active'  -- Status
);

-- Then create settings
INSERT INTO public.user_settings (user_id, dashboard_access, admin_privileges)
VALUES ('PASTE_USER_ID_HERE', true, true);

-- Grant module access
INSERT INTO public.module_access (user_id, module_type, has_access)
VALUES
    ('PASTE_USER_ID_HERE', 'invoice', true),
    ('PASTE_USER_ID_HERE', 'kdr', true),
    ('PASTE_USER_ID_HERE', 'ga', true),
    ('PASTE_USER_ID_HERE', 'kdr_inv', true),
    ('PASTE_USER_ID_HERE', 'kdr_sellout', true);
```

### 2.3 Verify Admin Creation

```sql
SELECT id, email, username, role, status, created_at
FROM public.profiles
WHERE email = 'admin@yourdomain.com';
```

**Expected result:**
- `role`: `admin`
- `status`: `active`
- `username`: Should show a username

---

## Step 3: Test Login

### 3.1 Start Your Application

```bash
npm run dev
```

### 3.2 Login

1. Open `http://localhost:3000/login`
2. Enter:
   - **Email or Username**: `admin@yourdomain.com` (or the username from verification)
   - **Password**: The password you created
3. Click **"تسجيل الدخول"** (Login)

### 3.3 Expected Result

✅ You should be redirected to `/admin` dashboard
✅ You should see:
   - Statistics cards (Total Salam/Mobily customers)
   - Navigation tabs: Dashboard, Salam, Mobily, User Management

---

## 🔧 Troubleshooting

### Error: "relation public.profiles does not exist"
**Solution**: You haven't run Step 1 yet. Go back and run `init_database.sql`.

### Error: "Invalid login credentials"
**Solution**:
- Verify the user was created in Authentication → Users
- Try using the email instead of username
- Reset password via Supabase Dashboard if needed

### User redirects to `/dashboard` instead of `/admin`
**Solution**:
```sql
-- Check the role
SELECT email, role FROM public.profiles WHERE email = 'admin@yourdomain.com';

-- If role is 'user', update it:
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';
```

### Error: "حسابك معطل" (Account disabled)
**Solution**:
```sql
UPDATE public.profiles SET status = 'active' WHERE email = 'admin@yourdomain.com';
```

### Profile not created automatically
**Solution**: The database trigger might not have fired. Use Option B in Step 2.2 to create the profile manually.

---

## 📋 Summary: Complete Checklist

- [ ] Step 1.2: Run `init_database.sql` in Supabase SQL Editor
- [ ] Step 1.3: Verify tables exist (profiles, salam_customers, mobily_customers)
- [ ] Step 2.1: Create user in Supabase Authentication panel
- [ ] Step 2.2: Promote user to admin role via SQL query
- [ ] Step 2.3: Verify admin user exists with correct role and status
- [ ] Step 3.1: Start application with `npm run dev`
- [ ] Step 3.2: Login at `/login` page
- [ ] Step 3.3: Confirm redirect to `/admin` dashboard

---

## 🎉 Success!

Once you complete all steps, you'll have:
- ✅ Database fully initialized with all tables and functions
- ✅ Admin user created and ready to use
- ✅ Access to the admin dashboard
- ✅ Ability to create more users via the admin UI

---

## 📚 Next Steps

After successful setup:
1. **Read the full guide**: `SUPABASE_AUTH_SETUP_GUIDE.md` for detailed information
2. **Create more users**: Use the admin dashboard → User Management tab
3. **Start using the app**: Create Salam and Mobily customer records
4. **Review SQL scripts**: Check `supabase/create_admin_user.sql` for more user management queries

---

## 🆘 Still Having Issues?

1. **Check Supabase Logs**: Dashboard → Logs → check for errors
2. **Verify Environment Variables**: Check `.env.local` has correct Supabase URL and keys
3. **Check Browser Console**: Open DevTools (F12) and look for JavaScript errors
4. **Database Functions**: Verify functions were created:
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_type = 'FUNCTION';
   ```

**Expected functions**:
- get_mobily_daily_count
- get_salam_daily_count
- get_stats_by_date_range
- handle_new_user
- is_admin
- update_updated_at_column

---

**Need Help?** Check the comprehensive guide in `SUPABASE_AUTH_SETUP_GUIDE.md`
