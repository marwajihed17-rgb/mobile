/**
 * Supabase Configuration
 *
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your actual Supabase project credentials.
 * These can be found in your Supabase project settings under API.
 */

// Supabase project configuration
const SUPABASE_URL = 'https://mlifjngvevazuxgwzinf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1saWZqbmd2ZXZhenV4Z3d6aW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NDU4NDAsImV4cCI6MjA4NDIyMTg0MH0.hLLbgARvpxNpcx3cz4_wbEeqY_-gwvzMz2c2E50PjVs';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other scripts
window.supabaseClient = supabase;
