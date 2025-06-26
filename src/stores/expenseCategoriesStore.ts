import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

interface ExpenseCategoriesStore {
  showExpenseDistribution: boolean;
  categoriesByQuote: Record<string, ExpenseCategory[]>;
  getCategories: (quoteId: string) => ExpenseCategory[];
  createCategory: (quoteId: string, name: string, color: string) => Promise<void>;
  updateCategory: (quoteId: string, id: string, updates: Partial<ExpenseCategory>) => Promise<void>;
  deleteCategory: (quoteId: string, id: string) => Promise<void>;
  toggleExpenseDistribution: () => void;
  loadCategories: (quoteId: string) => Promise<ExpenseCategory[]>;
}

export const useExpenseCategoriesStore = create<ExpenseCategoriesStore>()(
  persist(
    (set, get) => ({
      showExpenseDistribution: true, // Activé par défaut
      categoriesByQuote: {},

      getCategories: (quoteId) => {
        return get().categoriesByQuote[quoteId] || [];
      },

      loadCategories: async (quoteId) => {
        try {
          // Vérifier si les catégories sont déjà chargées
          const existingCategories = get().categoriesByQuote[quoteId];
          if (existingCategories && existingCategories.length > 0) {
            return existingCategories;
          }

          // Charger les catégories depuis la base de données
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

          // Mettre à jour le store
          set(state => ({
            categoriesByQuote: {
              ...state.categoriesByQuote,
              [quoteId]: categories
            }
          }));

          return categories;
        } catch (error) {
          console.error('Error loading expense categories:', error);
          return [];
        }
      },

      createCategory: async (quoteId, name, color) => {
        try {
          const { data, error } = await supabase
            .from('distribution_categories')
            .insert([{ quote_id: quoteId, name, color }])
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
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
            },
            showExpenseDistribution: true // Activer automatiquement l'affichage
          }));
        } catch (error) {
          console.error('Error creating expense category:', error);
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

          set((state) => ({
            categoriesByQuote: {
              ...state.categoriesByQuote,
              [quoteId]: state.categoriesByQuote[quoteId]?.map(category =>
                category.id === id ? { ...category, ...updates } : category
              ) || []
            }
          }));
        } catch (error) {
          console.error('Error updating expense category:', error);
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

          set((state) => ({
            categoriesByQuote: {
              ...state.categoriesByQuote,
              [quoteId]: state.categoriesByQuote[quoteId]?.filter(category => category.id !== id) || []
            }
          }));
        } catch (error) {
          console.error('Error deleting expense category:', error);
          throw error;
        }
      },

      toggleExpenseDistribution: () => {
        set((state) => ({
          showExpenseDistribution: !state.showExpenseDistribution
        }));
      }
    }),
    {
      name: 'expense-categories-storage',
      version: 1
    }
  )
);