# Database Migration Instructions

## Overview
This migration updates the Row-Level Security (RLS) policies for `salam_entries` and `mobily_entries` tables to allow users to delete and update their own customer entries, not just admins.

## Changes Made

### 1. Fixed Form Validation Issues
- **Salam Form** (`src/app/(protected)/salam/salam-form-client.tsx`)
  - Fixed duplicate check logic using `.maybeSingle()` instead of `.single()`
  - Added proper field validation
  - Improved error messages with specific error codes
  - Added input trimming for data consistency

- **Mobily Form** (`src/app/(protected)/mobily/mobily-form-client.tsx`)
  - Fixed duplicate check logic using `.maybeSingle()` instead of `.single()`
  - Added proper field validation for all 13 required fields
  - Improved error messages with specific error codes
  - Added input trimming for data consistency

### 2. Updated Database RLS Policies
- **Previous Behavior**: Only admins could delete and update customer entries
- **New Behavior**: Users can delete and update their own entries (entries they created), admins can manage all entries

### 3. Enhanced User Dashboard
- **Added Delete Functionality**: Users can now delete their own customer entries directly from the dashboard
- **Added Action Column**: New "الإجراءات" (Actions) column in both Salam and Mobily entry tables
- **Added Visual Feedback**: Success and error messages for delete operations
- **Added Confirmation Dialog**: Confirmation prompt before deleting entries

## How to Apply the Migration

### Option 1: Using Supabase SQL Editor (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/update_rls_policies.sql`
5. Click **Run** to execute the migration
6. Verify the policies are updated by checking the **Authentication > Policies** section

### Option 2: Using Supabase CLI
```bash
# Make sure you're in the project directory
cd /home/user/design-cellular

# Run the migration
supabase db push
```

## Migration SQL Summary
The migration performs the following operations:

1. **Drops old restrictive policies:**
   - `"Admins can update salam entries"`
   - `"Admins can delete salam entries"`
   - `"Admins can update mobily entries"`
   - `"Admins can delete mobily entries"`

2. **Creates new permissive policies:**
   - `"Users can update own salam entries"` - Allows updates if `auth.uid() = user_id OR is_admin()`
   - `"Users can delete own salam entries"` - Allows deletes if `auth.uid() = user_id OR is_admin()`
   - `"Users can update own mobily entries"` - Allows updates if `auth.uid() = user_id OR is_admin()`
   - `"Users can delete own mobily entries"` - Allows deletes if `auth.uid() = user_id OR is_admin()`

## Testing the Changes

### Test Adding Customers
1. Log in as a regular user (not admin)
2. Navigate to "مشروع سلام" or "مشروع موبايلي"
3. Fill in all required fields
4. Click "حفظ البيانات" (Save Data)
5. Verify success message appears: "تم حفظ البيانات بنجاح ✓"

### Test Deleting Customers
1. Log in as a regular user
2. Navigate to Dashboard > "الإدخالات الأخيرة" (Recent Entries)
3. Find an entry you created
4. Click the delete button (trash icon) in the "الإجراءات" column
5. Confirm the deletion in the popup dialog
6. Verify the entry is removed and success message appears

### Test Error Handling
1. Try adding a customer with a duplicate identity number
2. Verify error message: "المستخدم موجود مسبقاً - رقم الهوية مسجل من قبل"
3. Try submitting with empty fields
4. Verify error message: "يرجى ملء جميع الحقول المطلوبة"

## Required Fields

### Salam Project (7 fields):
- ✅ الإسم (Name)
- ✅ رقم الهوية (Identity Number) - Must be unique
- ✅ رقم الجوال (Phone Number)
- ✅ رقم الشريحة (SIM Number)
- ✅ رقم الجهاز (Device Number)
- ✅ الجنسية (Nationality)
- ✅ سجل (Register Number)

### Mobily Project (13 fields):
- ✅ الإسم (Name)
- ✅ رقم الهوية (Identity Number) - Must be unique
- ✅ الجنسية (Nationality)
- ✅ رقم الجوال (Phone Number)
- ✅ تاريخ الميلاد (Birth Date)
- ✅ تاريخ انتهاء الهوية (Identity Expiry Date)
- ✅ الباقة (Package)
- ✅ الإيميل (Email)
- ✅ الشريحة (SIM Number)
- ✅ الجهاز (Device Number)
- ✅ المدينة (City)
- ✅ الحي (District)
- ✅ سجل (Register Number)

## Troubleshooting

### Error: "حدث خطأ أثناء الحفظ" (Error occurred while saving)
**Possible Causes:**
1. Missing required fields - Check all fields are filled
2. Duplicate identity number - Try a different identity number
3. Database connection issue - Check Supabase connection in `.env.local`
4. RLS policies not updated - Apply the migration SQL

**Solution:**
- Check browser console for detailed error messages
- Verify all required fields are filled
- Ensure identity number is unique
- Apply the migration SQL if not already done

### Error: "خطأ في الاتصال بقاعدة البيانات" (Database connection error)
**Possible Causes:**
1. Invalid Supabase credentials in `.env.local`
2. Network connectivity issues
3. Supabase project is paused or down

**Solution:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Check Supabase project status in dashboard
- Restart the development server

## Database Connection Configuration

Ensure your `.env.local` file contains valid Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL='https://your-project.supabase.co'
NEXT_PUBLIC_SUPABASE_ANON_KEY='your-anon-key'
SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Current configuration:
- ✅ Supabase URL: `https://mlifjngvevazuxgwzinf.supabase.co`
- ✅ Connection configured and tested
- ✅ All environment variables present

## Summary of Fixes

✅ **Fixed**: Form error "حدث خطأ أثناء الحفظ" by correcting duplicate check logic
✅ **Fixed**: Missing field validation - all required fields are now validated
✅ **Added**: User deletion capability for own customer entries
✅ **Added**: Action buttons in dashboard for delete operations
✅ **Added**: Better error messages with specific error codes (23505, 23503)
✅ **Added**: Input trimming to prevent whitespace issues
✅ **Improved**: Database RLS policies to allow user self-management
✅ **Improved**: User experience with confirmation dialogs and success messages

## Notes
- The migration is **backward compatible** - admins retain all previous permissions
- Users can only delete/update entries **they created** (based on `user_id`)
- All database constraints remain intact (unique identity numbers, foreign keys, etc.)
- The schema file (`supabase/schema.sql`) has been updated as the source of truth
