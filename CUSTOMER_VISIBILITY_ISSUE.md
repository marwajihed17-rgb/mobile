# Customer Visibility Issue Fix Guide

## 🔴 The Problem

**Symptoms:**
- ✅ Customer created successfully (count increases)
- ❌ Customer data not visible in admin dashboard table
- ❌ Error message: "لا توجد بيانات عملاء في النظام. تأكد من وجود سجلات في قاعدة البيانات وأن لديك صلاحيات المشرف."

**Translation:** "There is no customer data in the system. Make sure there are records in the database and that you have admin permissions."

## 🔍 Root Cause

This is a **Row Level Security (RLS) policy issue**. The customer is created successfully, but when the admin tries to fetch the data:

1. Customer INSERT succeeds ✅ (RLS INSERT policy allows it)
2. Customer SELECT fails ❌ (RLS SELECT policy blocks it)

**Common causes:**
- `is_admin()` function missing or not working
- Admin user doesn't have correct role in database
- RLS policies not properly configured
- User session not authenticated properly

---

## ✅ Solution (Step-by-Step)

### Step 1: Diagnose the Issue

Open **Supabase SQL Editor** and run:

```bash
/supabase/diagnose_customer_visibility.sql
```

This will show you:
1. ✅ If customers exist in database
2. ✅ Current RLS policies
3. ✅ If `is_admin()` function works
4. ✅ Admin user role and status
5. ✅ Any orphaned customers

**Look for these key indicators:**

```sql
-- Step 5: Testing is_admin Function
-- Should show TRUE for admin users
email               | role         | is_admin_result
--------------------|--------------|----------------
admin@retaam.app    | super_admin  | true ✅

-- If is_admin_result is FALSE or NULL, that's your problem!
```

---

### Step 2: Fix RLS Policies

Run the fix script:

```bash
/supabase/fix_customer_visibility.sql
```

This will:
- ✅ Recreate `is_admin()` and `is_operator()` functions
- ✅ Recreate all RLS policies for customer tables
- ✅ Verify the fix worked

**Expected output:**
```
✅ RLS POLICIES FIXED
```

---

### Step 3: Verify Admin Role

Check your user's role:

```sql
SELECT email, username, role, status
FROM public.profiles
WHERE email = 'your@email.com';  -- Replace with your email
```

**Expected:**
- `role`: should be `'admin'` or `'super_admin'`
- `status`: should be `'active'`

**If role is wrong**, upgrade it:

```sql
UPDATE public.profiles
SET role = 'super_admin', status = 'active'
WHERE email = 'your@email.com';  -- Replace with your email
```

---

### Step 4: Test

1. **Sign out** completely from the app
2. **Clear browser cache** (or hard refresh: Ctrl+Shift+R)
3. **Sign in** again with admin credentials
4. **Navigate to admin dashboard**
5. **Check if customers are now visible** ✅

---

## 🎯 Quick Fix Reference

| Issue | SQL Fix |
|-------|---------|
| Admin can't see customers | Run `fix_customer_visibility.sql` |
| User has wrong role | `UPDATE profiles SET role='super_admin' WHERE email='your@email.com'` |
| is_admin returns FALSE | Check if user role is actually admin/super_admin |
| is_admin function missing | Run `fix_customer_visibility.sql` to recreate it |

---

## 💡 Understanding RLS Policies

### How RLS Works

```
User makes request → Supabase checks RLS policies → Allow or Deny
```

**For Salam/Mobily Customers:**

1. **SELECT (View) Policies:**
   - Users can view their own customers: `user_id = auth.uid()`
   - Admins can view ALL customers: `is_admin(auth.uid()) = true`
   - Operators can view assigned customers with specific status

2. **INSERT (Create) Policies:**
   - Users can only insert with their own `user_id`
   - Must set `user_id = auth.uid()`

3. **UPDATE (Edit) Policies:**
   - Users can update their own customers
   - Admins can update ALL customers
   - Operators can update assigned customers

4. **DELETE (Remove) Policies:**
   - Users can delete their own customers
   - Admins can delete ALL customers

### The is_admin Function

```sql
CREATE FUNCTION is_admin(check_user_id UUID) RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = check_user_id
        AND role IN ('admin', 'super_admin')
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**What it checks:**
1. User exists in profiles table ✅
2. User role is 'admin' or 'super_admin' ✅
3. User status is 'active' ✅

**If any condition fails → Returns FALSE → Admin cannot see data**

---

## 🔧 Advanced Troubleshooting

### Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for Supabase errors like:

```
Error fetching salam customers: {...}
Error fetching mobily customers: {...}
```

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Navigate to **Logs** → **Postgres Logs**
3. Look for policy violations:

```
policy violation on table "salam_customers"
```

### Manual RLS Test

Test if RLS is the issue:

```sql
-- Try to select customers as your admin user
SELECT * FROM public.salam_customers LIMIT 5;

-- If this returns nothing but customers exist, RLS is blocking
```

### Temporarily Disable RLS (Testing Only - NOT FOR PRODUCTION!)

```sql
-- ⚠️ WARNING: Only for testing! This removes all security
ALTER TABLE public.salam_customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobily_customers DISABLE ROW LEVEL SECURITY;

-- Test if data is visible now
-- If yes, the issue is definitely RLS policies

-- ⚠️ IMPORTANT: Re-enable after testing!
ALTER TABLE public.salam_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobily_customers ENABLE ROW LEVEL SECURITY;
```

---

## 📋 Complete Checklist

Follow this checklist in order:

- [ ] Run `diagnose_customer_visibility.sql`
- [ ] Identify the issue from diagnostic output
- [ ] Run `fix_customer_visibility.sql`
- [ ] Verify admin user has correct role
- [ ] Upgrade role if needed
- [ ] Sign out and clear cache
- [ ] Sign in again
- [ ] Verify customers are visible in admin dashboard
- [ ] Test creating new customer
- [ ] Test editing customer
- [ ] Test deleting customer

---

## 🚀 Prevention Tips

**To avoid this issue in the future:**

1. **Always verify admin role after creating user**
   ```sql
   SELECT email, role, status FROM profiles WHERE email='new-admin@email.com';
   ```

2. **Run diagnostics periodically**
   - Catches RLS issues early
   - Verifies functions are working

3. **Keep complete_database_setup.sql updated**
   - Single source of truth for schema
   - Easy to recreate if needed

4. **Test admin access after any database changes**
   - Create test customer
   - Verify visibility
   - Test CRUD operations

---

## 📝 Related Files

| File | Purpose |
|------|---------|
| `diagnose_customer_visibility.sql` | Comprehensive diagnostics |
| `fix_customer_visibility.sql` | Fix RLS policies and functions |
| `verify_admin_access.sql` | Check admin user setup |
| `complete_database_setup.sql` | Full database schema |

---

## 📞 Still Not Working?

If customers are still not visible after following this guide:

1. **Check diagnostics output carefully**
   - Look for error messages
   - Check is_admin function result
   - Verify user role

2. **Check Supabase logs for errors**
   - Policy violations
   - Function errors
   - Permission issues

3. **Verify authenticated session**
   - Make sure user is actually logged in
   - Check auth.uid() is not null
   - Try signing out and in again

4. **Last resort: Re-run complete database setup**
   - Backup your data first!
   - Run `complete_database_setup.sql`
   - This recreates everything from scratch

---

**Created**: 2026-02-11
**Issue**: Customer data created but not visible to admin
**Root Cause**: RLS policy blocking admin SELECT queries
**Solution**: Fix is_admin function and RLS policies
