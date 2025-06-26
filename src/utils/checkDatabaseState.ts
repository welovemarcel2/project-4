import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function checkDatabaseState() {
  try {
    // First check if we're online
    if (!navigator.onLine) {
      return {
        success: true,
        isOffline: true,
        counts: {
          users: 0,
          productions: 0,
          projects: 0
        }
      };
    }

    // Validate Supabase URL and key
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('Supabase configuration is missing. Assuming offline mode.');
      return {
        success: true,
        isOffline: true,
        counts: {
          users: 0,
          productions: 0,
          projects: 0
        }
      };
    }

    // Try to ping Supabase first to check connection
    try {
      const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
      if (error) throw error;
    } catch (error) {
      console.warn('Failed to connect to Supabase:', error);
      return {
        success: true,
        isOffline: true,
        counts: {
          users: 0,
          productions: 0,
          projects: 0
        }
      };
    }

    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (usersError) {
      console.error('Error checking users:', usersError);
      return { success: false, error: usersError };
    }

    // Check productions table
    const { data: productions, error: productionsError } = await supabase
      .from('productions')
      .select('count', { count: 'exact', head: true });

    if (productionsError) {
      console.error('Error checking productions:', productionsError);
      return { success: false, error: productionsError };
    }

    // Check projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('count', { count: 'exact', head: true });

    if (projectsError) {
      console.error('Error checking projects:', projectsError);
      return { success: false, error: projectsError };
    }

    // Return counts
    return {
      success: true,
      isOffline: false,
      counts: {
        users: users?.[0]?.count || 0,
        productions: productions?.[0]?.count || 0,
        projects: projects?.[0]?.count || 0
      }
    };
  } catch (error) {
    console.error('Error checking database state:', error);
    // Return offline state if we catch any errors
    return {
      success: true,
      isOffline: true,
      counts: {
        users: 0,
        productions: 0,
        projects: 0
      }
    };
  }
}