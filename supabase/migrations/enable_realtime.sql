-- Enable Realtime for all critical tables
-- This allows the application to receive real-time updates when data changes

-- Enable realtime for salam_customers table
ALTER PUBLICATION supabase_realtime ADD TABLE salam_customers;

-- Enable realtime for mobily_customers table
ALTER PUBLICATION supabase_realtime ADD TABLE mobily_customers;

-- Enable realtime for profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Enable realtime for user_settings table (optional - for future use)
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;

-- Optional: Enable realtime for chat messages (if you want real-time chat)
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Verify that realtime is enabled
-- Run this query to check: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
