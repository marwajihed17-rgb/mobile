# Database Migrations

## Active Migrations

These migrations are applied in order and maintain the current database schema:

1. **add_username_to_profiles.sql** - Adds username field to profiles table
2. **add_supervisor_and_stats.sql** - Adds supervisor tracking and statistics
3. **add_unique_sim_number.sql** - Ensures SIM numbers are unique per project
4. **create_customers_table.sql** - Creates initial customer tables structure
5. **drop_unused_tables.sql** - Removes deprecated tables
6. **fix_admin_access.sql** - Fixes admin access controls
7. **make_username_primary_identifier.sql** - Makes username the primary login identifier
8. **split_project_tables.sql** - Separates Salam and Mobily customer tables
9. **update_rls_policies.sql** - Updates Row Level Security policies
10. **dashboard_integration_complete.sql** - Completes dashboard integration
11. **add_calendar_type_fields.sql** - Adds Hijri/Gregorian calendar support
12. **final_database_fix.sql** - Final comprehensive database fix (RECOMMENDED FOR FRESH SETUPS)

## Current Schema

The application uses **separate tables** for each project:
- `salam_customers` - Salam project customer data (7 fields)
- `mobily_customers` - Mobily project customer data (13 fields)
- `profiles` - User profiles with role-based access
- `user_settings` - User preferences and settings

## Archive

The `archive/` directory contains old migrations that were superseded or not implemented:
- `complete_database_fix.sql` - Superseded by final_database_fix.sql
- `unify_customer_tables.sql` - Unified table approach (not implemented)
- `unify_customer_tables_fixed.sql` - Fixed version (not implemented)

These are kept for historical reference but should not be applied to new databases.

## For Fresh Database Setup

If setting up a fresh database, you can use **final_database_fix.sql** which includes all necessary schema changes in one comprehensive migration.
