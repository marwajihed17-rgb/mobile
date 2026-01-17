import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton instance for client-side usage
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseClient should only be used on the client side');
  }

  if (!browserClient) {
    browserClient = createClient();
  }

  return browserClient;
}
