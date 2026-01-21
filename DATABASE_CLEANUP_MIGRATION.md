# Database Cleanup Migration Guide

This document explains the database cleanup performed to remove unused tables and features.

## Overview

The following tables have been removed from the database as they are not needed for the application:

- ❌ **module_access** - Module access control (not used)
- ❌ **file_uploads** - File upload tracking (not needed)
- ❌ **chat_messages** - Chat messages (chat feature removed)
- ❌ **audit_logs** - Audit logging (not implemented)

## What Was Removed

### Database Tables
1. **chat_messages** - Used by the chat feature
2. **file_uploads** - Tracked uploaded files
3. **audit_logs** - Would have stored audit trail
4. **module_access** - Controlled user access to modules

### Database Functions
- `get_user_modules()` - Function that retrieved user module access

### Application Features
- **Chat Feature** (`/chat/[module]`) - Complete chat functionality removed
  - Chat UI components
  - Chat message storage
  - File upload in chat

### Code Changes

**TypeScript Types (`src/types/database.ts`)**
- Removed: `ModuleAccess` interface
- Removed: `FileUpload` interface
- Removed: `ChatMessage` interface
- Removed: `AuditLog` interface
- Removed: `ModuleType` enum
- Updated: `ProfileWithModules` → `ProfileWithSettings`
- Removed tables from `Database` interface

**Authentication Library (`src/lib/auth.ts`)**
- Removed: `checkModuleAccess()` function
- Updated: `getUserWithAccess()` → `getUserWithSettings()`
- Updated: `UserWithAccess` → `UserWithSettings` interface

**Storage Library (`src/lib/storage.ts`)**
- Removed: `saveFileRecord()` function

**Utilities (`src/lib/utils.ts`)**
- Removed: `MODULE_INFO` constant
- Removed: `ModuleKey` type

**Application Routes**
- Removed: `/chat/[module]` route and all chat components

## Migration Steps

### Step 1: Run the Migration SQL

Execute the cleanup migration in your Supabase SQL Editor:

```bash
# File location
supabase/migrations/drop_unused_tables.sql
```

**OR** run it directly in Supabase Dashboard:
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/drop_unused_tables.sql`
4. Execute the SQL

### Step 2: Verify the Migration

After running the migration, verify that the tables are removed:

```sql
-- Check if tables are dropped
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('chat_messages', 'file_uploads', 'audit_logs', 'module_access');

-- This should return 0 rows
```

### Step 3: Deploy the Application

Once the database migration is complete, deploy the updated application code.

## Remaining Tables

The following tables are still in use:

✅ **profiles** - User profiles
✅ **user_settings** - User settings and preferences
✅ **salam_entries** - Salam project customer entries (legacy)
✅ **mobily_entries** - Mobily project customer entries (legacy)
✅ **customers** - Unified customers table (NEW - recommended)

## Breaking Changes

### Removed Functionality
- ❌ Chat feature is no longer available
- ❌ Module-based access control is removed
- ❌ File upload tracking is removed

### Updated Function Names
- `getUserWithAccess()` → `getUserWithSettings()`
- `UserWithAccess` interface → `UserWithSettings` interface
- `ProfileWithModules` → `ProfileWithSettings`

### Removed Functions
- `checkModuleAccess()` - No longer needed
- `saveFileRecord()` - No longer needed

## Impact on Features

### No Impact
- ✅ User authentication and profiles
- ✅ Salam project forms
- ✅ Mobily project forms
- ✅ Dashboard and recent entries
- ✅ Admin functionality
- ✅ Customer management

### Removed
- ❌ Chat feature (`/chat/[module]`)
- ❌ Module-specific access controls
- ❌ File upload tracking

## Rollback Plan

If you need to rollback this migration, you would need to:

1. Recreate the tables using the original schema
2. Restore the removed code from git history
3. Restore any backed-up data

**Note:** It's recommended to backup your database before running the migration.

## Backup Command

Before running the migration, backup your database:

```bash
# Using Supabase CLI
supabase db dump > backup_before_cleanup.sql

# Or using pg_dump directly
pg_dump -h [your-host] -U postgres [your-db] > backup_before_cleanup.sql
```

## Post-Migration Checks

After migration, verify:

1. ✅ User login and authentication works
2. ✅ Dashboard loads correctly
3. ✅ Salam and Mobily forms save data
4. ✅ Recent entries display properly
5. ✅ Profile page works
6. ✅ Admin functions work (if applicable)

## Support

If you encounter any issues:

1. Check Supabase logs for database errors
2. Check browser console for frontend errors
3. Verify all migrations ran successfully
4. Check that the application code is updated

## Related Files

- Migration SQL: `supabase/migrations/drop_unused_tables.sql`
- Database Types: `src/types/database.ts`
- Auth Library: `src/lib/auth.ts`
- Storage Library: `src/lib/storage.ts`
- Utils: `src/lib/utils.ts`

## Summary

This cleanup removes unnecessary complexity from the application by:
- Removing unused tables (4 tables)
- Removing unused features (chat)
- Simplifying the codebase
- Reducing database size
- Improving maintainability

The core functionality (customer management for Salam and Mobily projects) remains fully functional.
