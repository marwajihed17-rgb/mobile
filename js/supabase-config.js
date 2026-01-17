/**
 * Supabase Configuration
 *
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your actual Supabase project credentials.
 * These can be found in your Supabase project settings under API.
 */

// Supabase project configuration
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other scripts
window.supabaseClient = supabase;
