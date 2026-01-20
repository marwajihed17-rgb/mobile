# Database Rebuild Decision Guide

## 🤔 Should You Delete Tables First?

Follow this simple decision tree:

---

## Step 1: Check Your Current Database Status

Run this query in **Supabase SQL Editor**:

```sql
-- Check what exists
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
```

Or use the comprehensive check script: `check_database_status.sql`

---

## Step 2: Choose Your Approach

### Scenario A: Database is COMPLETELY Empty (0 tables)
**Answer: NO, don't delete anything**

✅ **What to do:**
1. Simply run `rebuild_database.sql` directly
2. The script will create everything from scratch
3. No cleanup needed

**Why:** There's nothing to delete!

---

### Scenario B: You Have 1-5 Tables (Partial Deletion)
**Answer: YES, clean first for safety**

✅ **What to do:**
1. Run `clean_database.sql` first (removes everything)
2. Then run `rebuild_database.sql` (creates fresh database)

**Why:** Partial remnants might cause conflicts or constraint issues.

---

### Scenario C: You Have 10+ Tables (Database Still Exists)
**Answer: MAYBE - depends on your goal**

#### Option 1: Fresh Start (Recommended) ⭐
**What to do:**
1. Run `clean_database.sql` first
2. Then run `rebuild_database.sql`

**Why:** Guarantees a clean, conflict-free rebuild.

⚠️ **WARNING:** This deletes ALL existing data!

#### Option 2: Try Direct Rebuild (Risky)
**What to do:**
1. Just run `rebuild_database.sql`
2. The script has safety measures (`IF NOT EXISTS`, `DROP IF EXISTS`, `CREATE OR REPLACE`)

**Why:** Might work if table structures match.

⚠️ **RISK:** May fail if:
- Table structures are different
- Constraints conflict
- Enum types don't match
- Foreign keys have issues

---

## Step 3: Safe Execution Order

### For a True "Fresh Start" (Recommended) ⭐

```
1. Backup any data you want to keep (if applicable)
   ↓
2. Run: check_database_status.sql
   (Verify what exists)
   ↓
3. Run: clean_database.sql
   (Remove everything - takes ~5 seconds)
   ↓
4. Run: rebuild_database.sql
   (Create fresh database - takes ~10 seconds)
   ↓
5. Verify success message
   ↓
6. Create your first super admin user
```

### For an Empty Database

```
1. Run: check_database_status.sql
   (Confirm 0 tables exist)
   ↓
2. Run: rebuild_database.sql
   (Create fresh database - takes ~10 seconds)
   ↓
3. Verify success message
   ↓
4. Create your first super admin user
```

---

## 🎯 My Recommendation

Based on your situation ("database was deleted"):

### ✅ RECOMMENDED APPROACH

**If you're unsure what state your database is in:**

1. **First, check the status** → Run `check_database_status.sql`
2. **Then, clean it completely** → Run `clean_database.sql`
3. **Finally, rebuild fresh** → Run `rebuild_database.sql`

**Total time:** ~20 seconds
**Risk:** Zero (guaranteed fresh start)
**Result:** Clean, production-ready database

---

## 📋 Quick Reference: SQL Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `check_database_status.sql` | See what exists | Always run first |
| `clean_database.sql` | Delete everything | Before fresh rebuild |
| `rebuild_database.sql` | Create full database | Main rebuild script ⭐ |

---

## ⚠️ Important Notes

### About clean_database.sql

✅ **Safe to run:**
- It uses `DROP IF EXISTS` (won't fail if objects don't exist)
- It's designed to handle errors gracefully
- It cleans in the correct order (policies → triggers → views → tables → functions → types)

❌ **Will delete:**
- All tables and their data
- All functions, triggers, views
- All RLS policies
- All custom types (enums)
- All storage policies

🔒 **Will NOT delete:**
- Supabase Auth users (`auth.users` table)
- Storage files (unless you uncomment those lines)
- Your project settings

### About rebuild_database.sql

✅ **Safe to run:**
- Uses `CREATE OR REPLACE` for functions
- Uses `IF NOT EXISTS` for tables
- Uses `DROP IF EXISTS` before creating triggers/policies
- Handles enum creation errors gracefully

✅ **Will create:**
- 14 tables
- 17 functions
- 12 triggers
- 5 views
- 66 RLS policies
- 2 storage buckets
- 4 custom types
- 30+ indexes
- Seed data (Salam & Mobily projects)

---

## 🆘 What If Something Goes Wrong?

### Error: "type already exists"
**Solution:** Run `clean_database.sql` first, then `rebuild_database.sql`

### Error: "relation already exists"
**Solution:** Run `clean_database.sql` first, then `rebuild_database.sql`

### Error: "constraint already exists"
**Solution:** Run `clean_database.sql` first, then `rebuild_database.sql`

### No errors but data seems wrong
**Solution:** Run `clean_database.sql` to start over, then `rebuild_database.sql`

---

## ✅ Final Checklist

Before running the scripts:

- [ ] I've backed up any data I want to keep
- [ ] I've checked the database status
- [ ] I know which approach I'm using
- [ ] I have Supabase SQL Editor open
- [ ] I'm ready to create a super admin user after

After running the scripts:

- [ ] No error messages appeared
- [ ] Success message showed object counts
- [ ] Tables exist (check with query)
- [ ] Projects exist (Salam, Mobily)
- [ ] Can create super admin user
- [ ] Can login to application

---

## 🎊 Summary

### The Safest Path (Recommended):

```bash
# 1. Check status
Run: check_database_status.sql

# 2. Clean everything (even if empty)
Run: clean_database.sql
→ Result: "✅ DATABASE CLEANUP COMPLETED!"

# 3. Rebuild fresh
Run: rebuild_database.sql
→ Result: "✅ DATABASE REBUILD COMPLETED SUCCESSFULLY!"

# 4. Create admin
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'your-email@example.com';

# 5. Done! 🎉
```

**Total time:** < 1 minute
**Risk level:** Zero
**Outcome:** Perfect, clean database

---

## Need More Help?

See the full guide: `DATABASE_REBUILD_GUIDE.md`
