import { useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BudgetCategory } from '../types/budget';
import { User } from '../types/user';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function useHistory() {
  const createVersion = useCallback(async (
    quoteId: string,
    budget: BudgetCategory[],
    user: User,
    description: string
  ) => {
    try {
      // Get current version number
      const { data: currentVersion } = await supabase
        .from('quote_history')
        .select('version_number')
        .eq('quote_id', quoteId)
        .order('version_number', { ascending: false })
        .limit(1)
        .single();

      const nextVersion = (currentVersion?.version_number || 0) + 1;

      // Create new version
      const { error } = await supabase
        .from('quote_history')
        .insert({
          quote_id: quoteId,
          version_number: nextVersion,
          budget_data: budget,
          description,
          created_by: user.id
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating version:', error);
      throw error;
    }
  }, []);

  const getHistory = useCallback(async (quoteId: string) => {
    try {
      const { data, error } = await supabase
        .from('quote_history')
        .select(`
          *,
          created_by:users (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching history:', error);
      return [];
    }
  }, []);

  const restoreVersion = useCallback(async (quoteId: string, versionId: string) => {
    try {
      // Get version data
      const { data: version, error: versionError } = await supabase
        .from('quote_history')
        .select('budget_data')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      // Update current budget
      const { error: updateError } = await supabase
        .from('budgets')
        .upsert({
          quote_id: quoteId,
          budget_data: version.budget_data
        });

      if (updateError) throw updateError;

      return version.budget_data;
    } catch (error) {
      console.error('Error restoring version:', error);
      throw error;
    }
  }, []);

  return {
    createVersion,
    getHistory,
    restoreVersion
  };
}