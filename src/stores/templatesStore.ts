import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BudgetTemplate } from '../types/templates';
import { BudgetCategory } from '../types/budget';
import { generateId } from '../utils/generateId';
import { useUserStore } from './userStore';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface TemplatesStore {
  templates: BudgetTemplate[];
  isLoading: boolean;
  error: string | null;
  loadTemplates: () => Promise<void>;
  createTemplate: (name: string, budget: BudgetCategory[], description?: string) => Promise<BudgetTemplate | undefined>;
  deleteTemplate: (id: string) => Promise<void>;
  getTemplate: (id: string) => BudgetTemplate | undefined;
  updateTemplate: (id: string, updates: Partial<BudgetTemplate>) => Promise<void>;
  importTemplate: (budget: BudgetCategory[], name: string, description?: string) => Promise<BudgetTemplate | undefined>;
  getUserTemplates: () => BudgetTemplate[];
}

export const useTemplatesStore = create<TemplatesStore>()(
  persist(
    (set, get) => ({
      templates: [],
      isLoading: false,
      error: null,

      loadTemplates: async () => {
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) return;

        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase
            .from('budget_templates')
            .select('*')
            .eq('user_id', currentUser.id);

          if (error) throw error;

          const templates: BudgetTemplate[] = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            budget: item.budget_data,
            createdAt: new Date(item.created_at),
            updatedAt: new Date(item.updated_at),
            ownerId: item.user_id
          }));

          set({ templates, isLoading: false });
        } catch (error) {
          console.error('Error loading templates:', error);
          set({ error: 'Erreur lors du chargement des modèles', isLoading: false });
        }
      },

      createTemplate: async (name, budget, description) => {
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) return;

        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase
            .from('budget_templates')
            .insert({
              user_id: currentUser.id,
              name,
              description,
              budget_data: budget
            })
            .select()
            .single();

          if (error) throw error;

          const newTemplate: BudgetTemplate = {
            id: data.id,
            name: data.name,
            description: data.description,
            budget: data.budget_data,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            ownerId: data.user_id
          };

          set(state => ({
            templates: [...state.templates, newTemplate],
            isLoading: false
          }));

          return newTemplate;
        } catch (error) {
          console.error('Error creating template:', error);
          set({ error: 'Erreur lors de la création du modèle', isLoading: false });
        }
      },

      importTemplate: async (budget, name, description) => {
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) return;

        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase
            .from('budget_templates')
            .insert({
              user_id: currentUser.id,
              name,
              description,
              budget_data: budget
            })
            .select()
            .single();

          if (error) throw error;

          const newTemplate: BudgetTemplate = {
            id: data.id,
            name: data.name,
            description: data.description,
            budget: data.budget_data,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            ownerId: data.user_id
          };

          set(state => ({
            templates: [...state.templates, newTemplate],
            isLoading: false
          }));

          return newTemplate;
        } catch (error) {
          console.error('Error importing template:', error);
          set({ error: "Erreur lors de l'importation du modèle", isLoading: false });
        }
      },

      deleteTemplate: async (id) => {
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) return;

        try {
          set({ isLoading: true, error: null });

          const { error } = await supabase
            .from('budget_templates')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);

          if (error) throw error;

          set(state => ({
            templates: state.templates.filter(t => t.id !== id),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error deleting template:', error);
          set({ error: 'Erreur lors de la suppression du modèle', isLoading: false });
        }
      },

      getTemplate: (id) => {
        return get().templates.find(t => t.id === id);
      },

      updateTemplate: async (id, updates) => {
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) return;

        try {
          set({ isLoading: true, error: null });

          const updateData: any = {};
          if (updates.name) updateData.name = updates.name;
          if (updates.description !== undefined) updateData.description = updates.description;
          if (updates.budget) updateData.budget_data = updates.budget;

          const { error } = await supabase
            .from('budget_templates')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', currentUser.id);

          if (error) throw error;

          set(state => ({
            templates: state.templates.map(template =>
              template.id === id
                ? { 
                    ...template, 
                    ...updates, 
                    updatedAt: new Date() 
                  }
                : template
            ),
            isLoading: false
          }));
        } catch (error) {
          console.error('Error updating template:', error);
          set({ error: 'Erreur lors de la mise à jour du modèle', isLoading: false });
        }
      },

      getUserTemplates: () => {
        const currentUser = useUserStore.getState().currentUser;
        if (!currentUser) return [];

        return get().templates.filter(template => 
          template.ownerId === currentUser.id
        );
      }
    }),
    {
      name: 'templates-storage',
      version: 1
    }
  )
);