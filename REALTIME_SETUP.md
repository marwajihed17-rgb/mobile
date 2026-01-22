# Real-time Setup Guide

This application now has full real-time capabilities using Supabase Realtime. All dashboards, tables, and data displays update instantly when data changes across all users.

## What's Enabled

### Real-time Updates
- ✅ **Dashboard**: Recent customers update instantly when new entries are added
- ✅ **Admin Dashboard**: All customer tables, user profiles, and statistics update in real-time
- ✅ **Statistics**: Total counts and daily counts update automatically
- ✅ **User Management**: Profile changes reflect immediately across all admin users

### Tables with Realtime Enabled
1. `salam_customers` - All customer entries for Salam project
2. `mobily_customers` - All customer entries for Mobily project
3. `profiles` - User profiles and permissions
4. `user_settings` - User preferences (for future use)

## Setup Instructions

### 1. Enable Realtime in Supabase

You need to run the SQL migration to enable realtime on your tables. You have two options:

#### Option A: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the SQL from `supabase/migrations/enable_realtime.sql`

#### Option B: Via Supabase CLI (if you have it installed)
```bash
supabase db push
```

### 2. Verify Realtime is Enabled

Run this query in the Supabase SQL Editor to verify:

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

You should see entries for:
- salam_customers
- mobily_customers
- profiles
- user_settings

### 3. Check Connection Status

The application shows real-time connection indicators:
- **Green Wifi Icon**: Connected to real-time updates
- **Amber Wifi Icon**: Connecting or disconnected

## How It Works

### Real-time Hooks
Custom React hooks automatically subscribe to database changes:

1. **useRealtimeSalamCustomers** (`/hooks/useRealtimeCustomers.ts`)
   - Listens for INSERT, UPDATE, DELETE on salam_customers
   - Automatically updates the UI when changes occur

2. **useRealtimeMobilyCustomers** (`/hooks/useRealtimeCustomers.ts`)
   - Listens for INSERT, UPDATE, DELETE on mobily_customers
   - Automatically updates the UI when changes occur

3. **useRealtimeProfiles** (`/hooks/useRealtimeProfiles.ts`)
   - Listens for INSERT, UPDATE, DELETE on profiles
   - Keeps user list synchronized across all admin dashboards

4. **useRealtimeStats** (`/hooks/useRealtimeStats.ts`)
   - Recalculates statistics when customer data changes
   - Updates total and daily counts automatically

### Performance Optimizations

The following optimizations ensure the app stays fast:

1. **Memoization**: All filtering and computation uses `useMemo` to prevent unnecessary re-renders
2. **Callback Optimization**: Event handlers use `useCallback` to maintain referential equality
3. **Optimistic Updates**: Deletions and updates happen instantly in the UI
4. **Connection Pooling**: Single Supabase client instance for all real-time subscriptions
5. **Automatic Cleanup**: Subscriptions are properly cleaned up when components unmount

## Testing Real-time Updates

### Test 1: Multiple Users
1. Open the application in two different browsers (or incognito window)
2. Log in as different users
3. Add a customer in one browser
4. Watch it appear instantly in the other browser

### Test 2: Admin Dashboard
1. Open the admin dashboard
2. In another window, add or delete a customer
3. Watch the statistics and tables update automatically

### Test 3: User Management
1. Have two admin users open the user management page
2. One admin changes a user's status
3. The other admin sees the change instantly

## Troubleshooting

### Real-time not working?

1. **Check Connection Indicator**: Look for the wifi icon in the header
   - If it shows "Connecting..." for more than 5 seconds, there may be an issue

2. **Verify Realtime is Enabled**: Run the verification SQL query mentioned above

3. **Check Browser Console**: Look for messages like:
   - "Salam customers subscription status: SUBSCRIBED"
   - "Profile change received:"

4. **Check Network Tab**:
   - Look for WebSocket connections to Supabase
   - Should see status "101 Switching Protocols"

5. **Verify Supabase Configuration**:
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` is set correctly
   - Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set correctly

### Common Issues

**Issue**: Updates work but are delayed
- **Solution**: This is expected if there's network latency. Real-time updates typically arrive within 100-500ms.

**Issue**: Some tables update but others don't
- **Solution**: Verify all tables are added to the `supabase_realtime` publication

**Issue**: Real-time stops working after some time
- **Solution**: Check for any console errors. The app automatically reconnects if the WebSocket connection drops.

## Performance Considerations

The real-time implementation is optimized for performance:

1. **Efficient Subscriptions**: Each table has a dedicated channel
2. **Automatic Reconnection**: Handles network interruptions gracefully
3. **Memory Management**: Subscriptions are cleaned up when components unmount
4. **Debounced Stats**: Statistics are recalculated efficiently, not on every single change

## Security

Real-time subscriptions respect Row Level Security (RLS) policies:
- Users only receive updates for data they have permission to see
- Admin users see all updates
- Regular users see only their own data

## Next Steps

Consider enabling real-time for:
- Chat messages (for instant messaging)
- File uploads (to show upload progress across users)
- Notifications (for real-time alerts)

Just add the tables to the `supabase_realtime` publication and create corresponding hooks following the same pattern.
