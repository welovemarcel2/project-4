import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';
import { Distribution, DistributionCategory } from '../types/distribution';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface DistributionStore {
  categoriesByQuote: Record<string, DistributionCategory[]>;
  distributionsByItem: Record<string, Distribution[]>;
  getCategories: (quoteId: string) => Promise<DistributionCategory[]>;
  createCategory: (quoteId: string, name: string, color: string) => Promise<void>;
  updateCategory: (quoteId: string, id: string, updates: Partial<DistributionCategory>) => Promise<void>;
  deleteCategory: (quoteId: string, id: string) => Promise<void>;
  setDistributions: (itemId: string, quoteId: string, distributions: Distribution[]) => Promise<void>;
  getDistributions: (itemId: string, quoteId: string) => Promise<Distribution[]>;
}

export const useDistributionStore = create<DistributionStore>()(
  persist(
    (set, get) => ({
      categoriesByQuote: {},
      distributionsByItem: {},

      getCategories: async (quoteId) => {
        try {
          // First check local cache
          if (get().categoriesByQuote[quoteId]) {
            return get().categoriesByQuote[quoteId];
          }

          // If not in cache, fetch from Supabase
          const { data, error } = await supabase
            .from('distribution_categories')
            .select('*')
            .eq('quote_id', quoteId);

          if (error) throw error;

          const categories = data.map(cat => ({
            id: cat.id,
            name: cat.name,
            color: cat.color
          }));

          // Update cache
          set(state => ({
            categoriesByQuote: {
              ...state.categoriesByQuote,
              [quoteId]: categories
            }
          }));

          return categories;
        } catch (error) {
          console.error('Error fetching distribution categories:', error);
          throw error;
        }
      },

      createCategory: async (quoteId, name, color) => {
        try {
          const { data, error } = await supabase
            .from('distribution_categories')
            .insert([{ 
              quote_id: quoteId, 
              name, 
              color 
            }])
            .select()
            .single();

          if (error) throw error;

          // Update local cache
          set(state => ({
            categoriesByQuote: {
              ...state.categoriesByQuote,
              [quoteId]: [
                ...(state.categoriesByQuote[quoteId] || []),
                {
                  id: data.id,
                  name: data.name,
                  color: data.color
                }
              ]
            }
          }));
        } catch (error) {
          console.error('Error creating distribution category:', error);
          throw error;
        }
      },

      updateCategory: async (quoteId, id, updates) => {
        try {
          const { error } = await supabase
            .from('distribution_categories')
            .update(updates)
            .eq('id', id)
            .eq('quote_id', quoteId);

          if (error) throw error;

          // Update local cache
          set(state => ({
            categoriesByQuote: {
              ...state.categoriesByQuote,
              [quoteId]: state.categoriesByQuote[quoteId]?.map(category =>
                category.id === id ? { ...category, ...updates } : category
              ) || []
            }
          }));
        } catch (error) {
          console.error('Error updating distribution category:', error);
          throw error;
        }
      },

      deleteCategory: async (quoteId, id) => {
        try {
          const { error } = await supabase
            .from('distribution_categories')
            .delete()
            .eq('id', id)
            .eq('quote_id', quoteId);

          if (error) throw error;

          // Update local cache
          set(state => ({
            categoriesByQuote: {
              ...state.categoriesByQuote,
              [quoteId]: state.categoriesByQuote[quoteId]?.filter(category => category.id !== id) || []
            }
          }));
        } catch (error) {
          console.error('Error deleting distribution category:', error);
          throw error;
        }
      },

      setDistributions: async (itemId, quoteId, distributions) => {
        try {
          // First delete existing distributions for this item
          const { error: deleteError } = await supabase
            .from('distributions')
            .delete()
            .eq('item_id', itemId);

          if (deleteError) throw deleteError;

          // Then insert new distributions
          if (distributions.length > 0) {
            const { error: insertError } = await supabase
              .from('distributions')
              .insert(
                distributions.map(dist => ({
                  item_id: itemId,
                  category_id: dist.id,
                  amount: dist.amount,
                  type: dist.type
                }))
              );

            if (insertError) throw insertError;
          }

          // Update local cache
          set(state => ({
            distributionsByItem: {
              ...state.distributionsByItem,
              [itemId]: distributions
            }
          }));
        } catch (error) {
          console.error('Error saving distributions:', error);
          throw error;
        }
      },

      getDistributions: async (itemId, quoteId) => {
        try {
          // First check local cache
          if (get().distributionsByItem[itemId]) {
            return get().distributionsByItem[itemId];
          }

          // If not in cache, fetch from Supabase
          const { data, error } = await supabase
            .from('distributions')
            .select(`
              *,
              category:distribution_categories(*)
            `)
            .eq('item_id', itemId);

          if (error) throw error;

          const distributions = data.map(dist => ({
            id: dist.category.id,
            name: dist.category.name,
            amount: dist.amount,
            type: dist.type as 'percentage' | 'fixed'
          }));

          // Update local cache
          set(state => ({
            distributionsByItem: {
              ...state.distributionsByItem,
              [itemId]: distributions
            }
          }));

          return distributions;
        } catch (error) {
          console.error('Error fetching distributions:', error);
          throw error;
        }
      }
    }),
    {
      name: 'distribution-storage',
      version: 1
    }
  )
);