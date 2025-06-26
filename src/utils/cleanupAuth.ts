import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function cleanupAuthUsers() {
  // Only run this in development mode or when explicitly requested
  if (process.env.NODE_ENV !== 'development') {
    console.log('Skipping auth cleanup in production mode');
    return { success: true };
  }
  
  try {
    // 1. Sign out current user if any
    await supabase.auth.signOut();

    console.log('Successfully cleaned up auth session');
    return { success: true };
  } catch (error) {
    console.error('Error during auth cleanup:', error);
    // Return success even if some operations fail, as this is not critical
    return { success: true };
  }
}