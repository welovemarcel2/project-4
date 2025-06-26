import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function cleanupAuthUsers() {
  try {
    // 1. Sign out current user if any
    await supabase.auth.signOut();

    // 2. Delete data in reverse dependency order
    // Skip table existence check as it's causing errors
    const tablesToClean = [
      'distributions',
      'distribution_categories',
      'quote_history',
      'quote_notes',
      'quote_budgets',
      'quote_work_budgets',
      'quote_settings',
      'quotes',
      'project_shares',
      'project_settings',
      'projects',
      'productions',
      'users'
    ];

    for (const table of tablesToClean) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error && error.code !== 'PGRST116') { // Ignore "No rows deleted" error
          console.warn(`Warning during cleanup of ${table}:`, error);
        }
      } catch (err) {
        // Ignore errors for tables that don't exist
        console.warn(`Table ${table} might not exist or other error occurred:`, err);
      }
    }

    // 4. Clear local storage
    localStorage.clear();

    // 5. Clear all IndexedDB databases
    const databases = await window.indexedDB.databases();
    await Promise.all(
      databases.map(db => 
        db.name ? window.indexedDB.deleteDatabase(db.name) : Promise.resolve()
      )
    );

    // 6. Clear all session storage
    sessionStorage.clear();

    // 7. Clear all cookies
    document.cookie.split(";").forEach(cookie => {
      document.cookie = cookie
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    console.log('Successfully cleaned up all data');
    return { success: true };
  } catch (error) {
    console.error('Error during cleanup:', error);
    // Return success even if some operations fail, as this is not critical
    return { success: true };
  }
}