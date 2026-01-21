# Supabase Dashboard Integration Documentation

This document outlines the complete Supabase integration for the PAA Solutions dashboard, including database schema, API connectivity, and end-to-end data flow.

## Table of Contents

1. [Database Schema](#database-schema)
2. [User Management](#user-management)
3. [Customer Management](#customer-management)
4. [Daily Statistics](#daily-statistics)
5. [Data Flow](#data-flow)
6. [API Integration](#api-integration)
7. [Security & Permissions](#security--permissions)

---

## Database Schema

### 1. Users Table (profiles)

The `profiles` table extends Supabase Auth users with additional metadata:

```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    username TEXT,
    supervisor_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user' NOT NULL,
    status user_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Fields:**
- `username`: User's login name
- `supervisor_name`: Name of the supervisor who manages this user
- `status`: Account status (active, inactive, suspended)
- `role`: User role (user, admin, super_admin)

**Indexes:**
- `idx_profiles_email`: Fast email lookup
- `idx_profiles_role`: Role-based filtering
- `idx_profiles_status`: Status-based filtering

### 2. Customers Table

Customer data is split into two project-specific tables:

#### Salam Customers

```sql
CREATE TABLE salam_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_by_username TEXT,

    -- Customer fields (7 fields)
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT salam_customers_identity_unique UNIQUE (identity_number),
    CONSTRAINT salam_customers_sim_unique UNIQUE (sim_number)
);
```

#### Mobily Customers

```sql
CREATE TABLE mobily_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_by_username TEXT,

    -- Common fields (7 fields)
    name TEXT NOT NULL,
    identity_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    sim_number TEXT NOT NULL,
    device_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    register_number TEXT NOT NULL,

    -- Mobily-specific fields (6 additional fields)
    birth_date TEXT NOT NULL,
    identity_expiry_date TEXT NOT NULL,
    package TEXT NOT NULL,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    CONSTRAINT mobily_customers_identity_unique UNIQUE (identity_number),
    CONSTRAINT mobily_customers_sim_unique UNIQUE (sim_number)
);
```

**Constraints:**
- Unique ID numbers within each project
- Unique SIM numbers within each project
- Foreign key to profiles (creator tracking)

### 3. Projects Table

Projects are represented by separate customer tables:
- **Salam Project**: `salam_customers` table
- **Mobily Project**: `mobily_customers` table

### 4. Daily Statistics

Statistics are provided through database views and functions:

#### Views

```sql
-- Salam daily stats
CREATE VIEW salam_daily_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as customer_count,
    COUNT(DISTINCT user_id) as unique_users
FROM salam_customers
GROUP BY DATE(created_at);

-- Mobily daily stats
CREATE VIEW mobily_daily_stats AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as customer_count,
    COUNT(DISTINCT user_id) as unique_users
FROM mobily_customers
GROUP BY DATE(created_at);

-- Combined summary
CREATE VIEW daily_stats_summary AS
SELECT
    COALESCE(s.date, m.date) as date,
    COALESCE(s.customer_count, 0) as salam_count,
    COALESCE(m.customer_count, 0) as mobily_count,
    COALESCE(s.unique_users, 0) as salam_users,
    COALESCE(m.unique_users, 0) as mobily_users,
    COALESCE(s.customer_count, 0) + COALESCE(m.customer_count, 0) as total_count
FROM salam_daily_stats s
FULL OUTER JOIN mobily_daily_stats m ON s.date = m.date;
```

#### Functions

```sql
-- Get today's Salam customer count
CREATE FUNCTION get_salam_daily_count() RETURNS INTEGER;

-- Get today's Mobily customer count
CREATE FUNCTION get_mobily_daily_count() RETURNS INTEGER;

-- Get stats for a date range
CREATE FUNCTION get_stats_by_date_range(
    p_start_date DATE,
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    date DATE,
    salam_count BIGINT,
    mobily_count BIGINT,
    total_count BIGINT
);
```

---

## User Management

### Adding a New User

**Admin Dashboard → User Management → Add User**

1. Fill in the form:
   - Username (required)
   - Supervisor Name (required)
   - Password (required)

2. The system:
   - Generates a system email: `{username}@system.local`
   - Creates an auth user with Supabase Auth
   - Stores `username` and `supervisor_name` in metadata
   - Triggers `handle_new_user()` function to create profile

3. User is created with:
   - Status: `active`
   - Role: `user` (default)
   - Full profile entry in `profiles` table

### User Table Display

The admin user management table shows:
- Username
- Supervisor Name
- Status (editable dropdown: active/inactive)
- Created Date
- Actions (delete button)

### Updating User Status

Admins can update user status directly from the table:
1. Click the status dropdown
2. Select new status (active/inactive)
3. Changes sync immediately to Supabase

---

## Customer Management

### Creating Customers

**Project Pages (Salam/Mobily) → Add Customer**

1. Fill in customer form with all required fields
2. Real-time validation:
   - Identity number uniqueness (on blur)
   - SIM number uniqueness (on blur)
3. Submit form
4. System stores:
   - `user_id`: Current logged-in user's ID
   - `created_by_username`: Creator's username
   - All customer data fields

### Viewing Customers

**Admin Dashboard → Project Views**

- View all customers for Salam or Mobily projects
- Each row shows customer data + creator username
- Data fetched with profile join:
  ```typescript
  .select('*, profiles(username, full_name, email)')
  ```

---

## Daily Statistics

### Admin Dashboard KPIs

Four statistics cards display:
1. **Total Salam Customers**: Count of all salam_customers records
2. **Total Mobily Customers**: Count of all mobily_customers records
3. **Daily Salam Users**: Today's new Salam customers (via `get_salam_daily_count()`)
4. **Daily Mobily Users**: Today's new Mobily customers (via `get_mobily_daily_count()`)

### Implementation

```typescript
// Admin dashboard fetches daily counts using database functions
const { data: salamDailyCountData } = await supabase.rpc('get_salam_daily_count');
const { data: mobilyDailyCountData } = await supabase.rpc('get_mobily_daily_count');
```

Benefits:
- Efficient: Computed in database
- Accurate: Always reflects current date
- Real-time: Updates automatically on page refresh

---

## Data Flow

### Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐     ┌──────────────┐     ┌─────────────┐ │
│  │   Dashboard  │     │    Admin     │     │   Projects  │ │
│  │    Client    │────▶│    Client    │────▶│    Forms    │ │
│  └──────────────┘     └──────────────┘     └─────────────┘ │
│         │                     │                     │        │
└─────────┼─────────────────────┼─────────────────────┼────────┘
          │                     │                     │
          ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE CLIENT (API)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • Auth: getUser(), signUp(), signOut()                     │
│  • CRUD: from('table').select/insert/update/delete()        │
│  • RPC: rpc('function_name', params)                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
          │                     │                     │
          ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE DATABASE                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  profiles  │◀───│   salam_    │    │  mobily_    │      │
│  │            │    │  customers  │    │  customers  │      │
│  └────────────┘    └─────────────┘    └─────────────┘      │
│         │                  │                   │             │
│         │                  ▼                   ▼             │
│         │          ┌──────────────────────────────┐         │
│         │          │   Daily Stats Views          │         │
│         │          │  • salam_daily_stats         │         │
│         │          │  • mobily_daily_stats        │         │
│         │          │  • daily_stats_summary       │         │
│         │          └──────────────────────────────┘         │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────────────────────────────┐              │
│  │   Row Level Security (RLS) Policies      │              │
│  │  • Users see own data                    │              │
│  │  • Admins see all data                   │              │
│  └──────────────────────────────────────────┘              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Bidirectional Connectivity

#### Frontend → Supabase (Write Operations)

1. **Create User**
   ```typescript
   supabase.auth.signUp({
     email, password,
     options: { data: { username, supervisor_name } }
   })
   ```

2. **Create Customer**
   ```typescript
   supabase.from('salam_customers').insert({
     user_id, created_by_username, ...customerData
   })
   ```

3. **Update User Status**
   ```typescript
   supabase.from('profiles').update({ status }).eq('id', userId)
   ```

4. **Delete User**
   ```typescript
   supabase.from('profiles').delete().eq('id', userId)
   ```

#### Supabase → Frontend (Read Operations)

1. **Retrieve Users**
   ```typescript
   supabase.from('profiles')
     .select('*')
     .order('created_at', { ascending: false })
   ```

2. **Retrieve Customers with Creator**
   ```typescript
   supabase.from('salam_customers')
     .select('*, profiles(username, full_name, email)')
     .order('created_at', { ascending: false })
   ```

3. **Get Daily Statistics**
   ```typescript
   const { data } = await supabase.rpc('get_salam_daily_count')
   ```

4. **Real-time Filtering**
   ```typescript
   // Client-side filtering (for UI responsiveness)
   customers.filter(c =>
     c.name.includes(searchQuery) ||
     c.created_at.startsWith(dateFilter)
   )

   // OR Server-side filtering (for large datasets)
   supabase.from('salam_customers')
     .select('*')
     .ilike('name', `%${searchQuery}%`)
     .gte('created_at', startDate)
     .lte('created_at', endDate)
   ```

---

## API Integration

### Supabase Client Setup

**Browser Client** (`src/lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export const getSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Server Client** (`src/lib/supabase/server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'

export const createClient = () => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { ... } }
  )
}
```

### Authentication Flow

1. User logs in via `/login`
2. Supabase Auth creates session
3. Session stored in HTTP-only cookies
4. Middleware refreshes session on each request
5. Protected routes check for valid session

### CRUD Operations

All CRUD operations use the Supabase client with proper error handling:

```typescript
try {
  const { data, error } = await supabase
    .from('table_name')
    .operation()

  if (error) throw error
  // Handle success
} catch (err) {
  // Handle error
}
```

---

## Security & Permissions

### Row Level Security (RLS)

All tables have RLS enabled with policies:

#### Profiles
- Users can view own profile
- Admins can view all profiles
- Users can update own profile (limited fields)
- Admins can update any profile

#### Customers (Salam & Mobily)
- Users can view own customers
- Admins can view all customers
- Users can insert/update/delete own customers
- Admins can insert/update/delete all customers

### Foreign Keys

1. **customers.user_id → profiles.id**
   - Ensures customer belongs to valid user
   - CASCADE delete: When user deleted, their customers are deleted

2. **profiles.id → auth.users.id**
   - Links profile to auth user
   - CASCADE delete: When auth user deleted, profile is deleted

### Unique Constraints

1. **Identity Number**: Unique per project
   - Prevents duplicate ID numbers in Salam
   - Prevents duplicate ID numbers in Mobily

2. **SIM Number**: Unique per project
   - Prevents duplicate SIM numbers in Salam
   - Prevents duplicate SIM numbers in Mobily

### Validation

**Client-side**
- Real-time uniqueness checks (on blur)
- Required field validation
- Format validation

**Server-side**
- Database constraints enforce uniqueness
- Foreign key constraints ensure referential integrity
- RLS policies enforce access control

---

## Testing the Integration

### 1. User Management Test

1. Log in as admin
2. Go to Admin Dashboard → User Management
3. Click "Add User"
4. Fill in:
   - Username: "test_user"
   - Supervisor Name: "John Doe"
   - Password: "securepass123"
5. Submit form
6. Verify:
   - User appears in users table
   - Username is displayed
   - Supervisor name is displayed
   - Status is "active"

### 2. Customer Creation Test

1. Log in as regular user
2. Go to Salam Project or Mobily Project
3. Fill in customer form
4. Submit
5. Verify:
   - Customer is saved to database
   - `user_id` is set to current user
   - `created_by_username` is set to creator

### 3. Admin Dashboard Test

1. Log in as admin
2. Go to Admin Dashboard
3. Verify:
   - Total counts are accurate
   - Daily counts show today's entries
   - Can view all customers
   - Can see creator usernames

### 4. Filtering Test

1. In Admin Dashboard → Salam/Mobily view
2. Test search filter:
   - Search by name
   - Search by ID number
   - Search by phone
3. Test date filter:
   - Select a date
   - Verify only that date's entries show

### 5. Data Flow Test

1. Create a customer
2. Refresh admin dashboard
3. Verify customer appears immediately
4. Update user status
5. Verify status updates in real-time
6. Delete a customer
7. Verify it's removed from the list

---

## Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Database Migrations

To apply the schema updates:

1. Go to Supabase Dashboard → SQL Editor
2. Run `supabase/schema.sql` for complete setup
3. OR run `supabase/migrations/add_supervisor_and_stats.sql` for updates only

---

## Summary

This integration provides:

✅ **Complete user management** with username, supervisor_name, and status tracking
✅ **Project-based customer management** with creator tracking
✅ **Daily statistics** with efficient database functions
✅ **Real-time data filtering** by search and date
✅ **Secure authentication** with Supabase Auth
✅ **Row-level security** for data access control
✅ **Bidirectional data flow** between frontend and Supabase
✅ **Unique constraints** for ID and SIM numbers
✅ **Foreign key relationships** for data integrity
✅ **End-to-end functionality** from UI to database

All features are fully functional and tested for production use.
