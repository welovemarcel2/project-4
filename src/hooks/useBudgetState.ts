import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BudgetCategory, BudgetLine, BudgetItemType } from '../types/budget';
import { QuoteSettings } from '../types/quoteSettings';
import { createBudgetItem } from '../utils/budget/itemCreation';
import { SyncManager } from '../utils/syncManager';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface BudgetData {
  budget: BudgetCategory[];
  workBudget: BudgetCategory[];
  isWorkBudgetActive: boolean;
  lastSaved?: Date;
}

interface BudgetState {
  budgets: Record<string, BudgetData>;
  initializeBudget: (quoteId: string, isAdditive: boolean) => void;
  getBudget: (quoteId: string) => BudgetCategory[];
  getWorkBudget: (quoteId: string) => BudgetCategory[];
  isWorkBudgetActive: (quoteId: string) => boolean;
  updateBudget: (quoteId: string, newBudget: BudgetCategory[] | null | undefined, isWorkBudget?: boolean) => void;
  addItem: (quoteId: string, categoryId: string | null, parentId: string | null, type: BudgetItemType, settings: QuoteSettings, isWorkBudget?: boolean) => void;
  updateItem: (quoteId: string, categoryId: string, itemId: string, updates: Partial<BudgetLine>, saveToBackend?: boolean) => Promise<void>;
  deleteItem: (quoteId: string, categoryId: string, itemId: string, isWorkBudget?: boolean) => void;
  updateCategory: (quoteId: string, categoryId: string, updates: Partial<BudgetCategory>, isWorkBudget?: boolean) => void;
  initializeWorkBudget: (quoteId: string) => void;
  resetWorkBudget: (quoteId: string) => void;
  loadWorkBudget: (quoteId: string) => Promise<void>;
  addWorkItem: (quoteId: string, categoryId: string, parentId: string, type: BudgetItemType, settings: QuoteSettings) => void;
  updateWorkItem: (quoteId: string, categoryId: string, itemId: string, updates: Partial<BudgetLine>) => void;
  deleteWorkItem: (quoteId: string, categoryId: string, itemId: string) => void;
  updateWorkCategory: (quoteId: string, categoryId: string, updates: Partial<BudgetCategory>) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: {},

      initializeBudget: (quoteId, isAdditive) => {
        set(state => ({
          budgets: {
            ...state.budgets,
            [quoteId]: {
              budget: [],
              workBudget: [],
              isWorkBudgetActive: false,
              lastSaved: new Date()
            }
          }
        }));
      },

      getBudget: (quoteId) => {
        const budget = get().budgets[quoteId]?.budget;
        return Array.isArray(budget) ? budget : [];
      },

      getWorkBudget: (quoteId) => {
        const workBudget = get().budgets[quoteId]?.workBudget;
        return Array.isArray(workBudget) ? workBudget : [];
      },

      isWorkBudgetActive: (quoteId) => {
        return get().budgets[quoteId]?.isWorkBudgetActive || false;
      },

      loadWorkBudget: async (quoteId) => {
        try {
          // Check if a work budget exists for this quote
          console.log('Loading work budget for quote:', quoteId);
          const { data: workBudgetData, error } = await supabase
            .from('quote_work_budgets')
            .select('budget_data, comments')
            .eq('quote_id', quoteId)
            .maybeSingle();

          if (error) {
            console.error('Error loading work budget:', error);
            return;
          }

          if (workBudgetData) {
            // Apply comments to budget items if they exist
            let workBudget = workBudgetData.budget_data;
            
            if (workBudgetData.comments) {
              const comments = workBudgetData.comments;
              const applyComments = (items: BudgetLine[]) => {
                return items.map(item => {
                  const updatedItem = { ...item };
                  if (comments[item.id]) {
                    updatedItem.comments = comments[item.id];
                  }
                  if (updatedItem.subItems) {
                    updatedItem.subItems = applyComments(updatedItem.subItems);
                  }
                  return updatedItem;
                });
              };

              workBudget = workBudget.map(category => ({
                ...category,
                items: applyComments(category.items)
              }));
            }

            // Update the store with the loaded work budget
            const budgetData = get().budgets[quoteId] || {
              budget: [],
              workBudget: [],
              isWorkBudgetActive: false,
              lastSaved: new Date()
            };

            set(state => ({
              budgets: {
                ...state.budgets,
                [quoteId]: {
                  ...budgetData,
                  workBudget: workBudget,
                  isWorkBudgetActive: true,
                  lastSaved: new Date(workBudgetData.updated_at || new Date())
                }
              }
            }));

            console.log('Work budget loaded successfully for quote:', quoteId);
          } else {
            console.log('No work budget found for quote:', quoteId);
          }
        } catch (error) {
          console.error('Error loading work budget:', error);
        }
      },

      updateBudget: async (quoteId, newBudget, isWorkBudget = false) => {
        const validatedBudget = Array.isArray(newBudget) ? newBudget : [];
        // Make a deep copy of the budget data
        const budgetData = JSON.parse(JSON.stringify(get().budgets[quoteId] || { 
          budget: [], 
          workBudget: [], 
          isWorkBudgetActive: false,
          lastSaved: new Date()
        }));

        // Deep clone the budget to avoid reference issues
        const clonedBudget = JSON.parse(JSON.stringify(validatedBudget));

        if (isWorkBudget) {
          set(state => ({
            budgets: {
              ...state.budgets,
              [quoteId]: {
                ...budgetData,
                workBudget: clonedBudget,
                lastSaved: new Date()
              }
            }
          }));

          if (!navigator.onLine) {
            SyncManager.getInstance().addPendingSync({
              id: quoteId,
              type: 'budget',
              operation: 'update',
              data: { work_budget_data: validatedBudget }
            });
          } else {
            try {
              // Extract comments from budget items for separate storage
              const comments: Record<string, string> = {};
              const extractComments = (items: BudgetLine[]) => {
                items.forEach(item => {
                  if (item.comments) {
                    comments[item.id] = item.comments;
                  }
                  if (item.subItems && item.subItems.length > 0) {
                    extractComments(item.subItems);
                  }
                });
              };
              
              validatedBudget.forEach(category => {
                extractComments(category.items);
              });

              // Use upsert to handle both insert and update cases
              const { error } = await supabase
                .from('quote_work_budgets')
                .upsert(
                  { 
                    quote_id: quoteId, 
                    budget_data: validatedBudget,
                    comments: comments
                  },
                  {
                    onConflict: 'quote_id'
                  }
                );

              if (error) {
                console.error('Error updating work budget in Supabase:', error);
              }
            } catch (error) {
              console.error('Error syncing work budget with Supabase:', error);
            }
          }
        } else {
          set(state => ({
            budgets: {
              ...state.budgets,
              [quoteId]: {
                ...budgetData,
                budget: clonedBudget,
                lastSaved: new Date()
              }
            }
          }));

          if (!navigator.onLine) {
            SyncManager.getInstance().addPendingSync({
              id: quoteId,
              type: 'budget',
              operation: 'update',
              data: { budget_data: validatedBudget }
            });
          } else {
            try {
              // Use upsert for regular budget updates as well
              const { error } = await supabase
                .from('quote_budgets')
                .upsert(
                  { 
                    quote_id: quoteId, 
                    budget_data: validatedBudget 
                  },
                  {
                    onConflict: 'quote_id'
                  }
                );

              if (error) {
                console.error('Error updating budget in Supabase:', error);
              } else {
                console.log('Budget updated successfully in Supabase for quote:', quoteId);
              }
            } catch (error) {
              console.error('Error syncing budget with Supabase:', error);
            }
          }
        }
      },

      addItem: (quoteId, categoryId, parentId, type, settings, isWorkBudget = false) => {
        const state = get();
        const budgetData = state.budgets[quoteId] || {
          budget: [],
          workBudget: [],
          isWorkBudgetActive: false,
          lastSaved: new Date()
        };

        const currentBudget = isWorkBudget ? budgetData.workBudget : budgetData.budget;
        const safeCurrentBudget = Array.isArray(currentBudget) ? currentBudget : [];

        try {
          const newItem = createBudgetItem(type, parentId, settings, safeCurrentBudget, categoryId, isWorkBudget);
          
          if (!navigator.onLine) {
            SyncManager.getInstance().addPendingSync({
              id: newItem.id,
              type: 'budget',
              operation: 'insert',
              data: { 
                item: newItem, 
                isWorkBudget,
                quoteId
              }
            });
          }
          
          let updatedBudget: BudgetCategory[];
          if (type === 'category') {
            updatedBudget = [...safeCurrentBudget, { 
              id: newItem.id, 
              name: newItem.name, 
              isExpanded: true,
              items: [],
            }];
          } else {
            updatedBudget = safeCurrentBudget.map(category => {
              if (category.id !== categoryId) return category;

              const updateItems = (items: BudgetLine[]): BudgetLine[] => {
                if (!parentId) {
                  return [...(Array.isArray(items) ? items : []), newItem];
                }

                return (Array.isArray(items) ? items : []).map(item => {
                  if (item.id === parentId) {
                    return {
                      ...item,
                      subItems: [...(Array.isArray(item.subItems) ? item.subItems : []), newItem],
                      isExpanded: true
                    };
                  }
                  if (item.subItems) {
                    return {
                      ...item,
                      subItems: updateItems(item.subItems)
                    };
                  }
                  return item;
                });
              };

              return {
                ...category,
                items: updateItems(category.items || [])
              };
            });
          }

          if (isWorkBudget) {
            set(state => ({
              budgets: {
                ...state.budgets,
                [quoteId]: {
                  ...budgetData,
                  workBudget: JSON.parse(JSON.stringify(updatedBudget)),
                  isWorkBudgetActive: true,
                  lastSaved: new Date()
                }
              }
            }));
          } else {
            set(state => ({
              budgets: {
                ...state.budgets,
                [quoteId]: {
                  ...budgetData,
                  budget: updatedBudget,
                  lastSaved: new Date()
                }
              }
            }));
          }

          // Save to Supabase immediately
          get().updateBudget(quoteId, updatedBudget, isWorkBudget);
        } catch (error) {
          console.error('Error adding item:', error);
          throw error;
        }
      },

      updateItem: async (quoteId, categoryId, itemId, updates, saveToBackend = true) => {
        console.log('Updating item for quote:', quoteId, 'category:', categoryId, 'item:', itemId);
        console.log('Updates:', updates);
        
        const state = get();
        // Deep clone to avoid reference issues
        const budgetData = JSON.parse(JSON.stringify(state.budgets[quoteId] || {
          budget: [],
          workBudget: [], 
          isWorkBudgetActive: false,
          lastSaved: new Date()
        }));

        // Determine if we're working with the work budget
        const isWorkBudget = state.budgets[quoteId]?.isWorkBudgetActive || false;
        const currentBudget = isWorkBudget ? budgetData.workBudget : budgetData.budget;
        const safeCurrentBudget = Array.isArray(currentBudget) ? currentBudget : [];

        try {
          if (!navigator.onLine) {
            SyncManager.getInstance().addPendingSync({
              id: itemId,
              type: 'budget',
              operation: 'update',
              data: { 
                categoryId, 
                itemId, 
                updates,
                isWorkBudget,
                quoteId
              }
            });
          }

          const updatedBudget = safeCurrentBudget.map(category => {
            if (category.id !== categoryId) return category;

            const updateItems = (items: BudgetLine[]): BudgetLine[] => {
              return (Array.isArray(items) ? items : []).map(item => {
                if (item.id === itemId) {
                  return { ...item, ...updates };
                }
                if (item.subItems) {
                  return {
                    ...item,
                    subItems: updateItems(item.subItems)
                  };
                }
                return item;
              });
            };

            return {
              ...category,
              items: updateItems(category.items || [])
            };
          });

          if (isWorkBudget) {
            set(state => ({
              budgets: {
                ...state.budgets,
                [quoteId]: {
                  ...budgetData,
                  workBudget: JSON.parse(JSON.stringify(updatedBudget)),
                  lastSaved: new Date()
                }
              }
            }));
          } else {
            set(state => ({
              budgets: {
                ...state.budgets,
                [quoteId]: {
                  ...budgetData,
                  budget: JSON.parse(JSON.stringify(updatedBudget)),
                  lastSaved: new Date()
                }
              }
            }));
          }

          // Save to Supabase if requested
          if (saveToBackend) {
            await get().updateBudget(quoteId, updatedBudget, isWorkBudget);
          }
        } catch (error) {
          console.error('Error updating item:', error);
          throw error;
        }
      },

      deleteItem: (quoteId, categoryId, itemId, isWorkBudget = false) => {
        const state = get();
        const budgetData = state.budgets[quoteId] || {
          budget: [],
          workBudget: [],
          isWorkBudgetActive: false,
          lastSaved: new Date()
        };

        const currentBudget = isWorkBudget ? budgetData.workBudget : budgetData.budget;
        const safeCurrentBudget = Array.isArray(currentBudget) ? currentBudget : [];

        let updatedBudget: BudgetCategory[];

        if (categoryId === itemId) {
          updatedBudget = safeCurrentBudget.filter(category => 
            category.id !== categoryId || category.id === 'social-charges'
          );
        } else {
          updatedBudget = safeCurrentBudget.map(category => {
            if (category.id !== categoryId) return category;

            const deleteFromItems = (items: BudgetLine[]): BudgetLine[] => {
              return (Array.isArray(items) ? items : []).filter(item => {
                if (item.id === itemId) return false;
                if (item.subItems) {
                  item.subItems = deleteFromItems(item.subItems);
                }
                return true;
              });
            };

            return {
              ...category,
              items: deleteFromItems(category.items || [])
            };
          });
        }

        if (isWorkBudget) {
          set(state => ({
            budgets: {
              ...state.budgets,
              [quoteId]: {
                ...budgetData,
                workBudget: updatedBudget,
                lastSaved: new Date()
              }
            }
          }));
        } else {
          set(state => ({
            budgets: {
              ...state.budgets,
              [quoteId]: {
                ...budgetData,
                budget: updatedBudget,
                lastSaved: new Date()
              }
            }
          }));
        }

        // Save to Supabase immediately
        get().updateBudget(quoteId, updatedBudget, isWorkBudget);
      },

      updateCategory: (quoteId, categoryId, updates, isWorkBudget = false) => {
        const state = get();
        const budgetData = state.budgets[quoteId] || {
          budget: [],
          workBudget: [],
          isWorkBudgetActive: false,
          lastSaved: new Date()
        };

        const currentBudget = isWorkBudget ? budgetData.workBudget : budgetData.budget;
        const safeCurrentBudget = Array.isArray(currentBudget) ? currentBudget : [];
        
        const updatedBudget = safeCurrentBudget.map(category =>
          category.id === categoryId
            ? { ...category, ...updates }
            : category
        );

        if (isWorkBudget) {
          set(state => ({
            budgets: {
              ...state.budgets,
              [quoteId]: {
                ...budgetData,
                workBudget: updatedBudget,
                lastSaved: new Date()
              }
            }
          }));
        } else {
          set(state => ({
            budgets: {
              ...state.budgets,
              [quoteId]: {
                ...budgetData,
                budget: updatedBudget,
                lastSaved: new Date()
              }
            }
          }));
        }

        // Save to Supabase immediately
        get().updateBudget(quoteId, updatedBudget, isWorkBudget);
      },

      initializeWorkBudget: (quoteId) => {
        const state = get();
        const budgetData = state.budgets[quoteId] || {
          budget: [],
          workBudget: [],
          isWorkBudgetActive: false,
          lastSaved: new Date()
        };
        
        if (Array.isArray(budgetData.workBudget) && budgetData.workBudget.length > 0) {
          return;
        }
        const currentBudget = Array.isArray(budgetData.budget) ? budgetData.budget : [];
        
        // Nettoyer le champ comment sur chaque ligne
        function cleanComments(categories: BudgetCategory[]): BudgetCategory[] {
          return categories.map((category: BudgetCategory) => ({
            ...category,
            items: cleanItems(category.items)
          }));
        }
        function cleanItems(items: BudgetLine[]): BudgetLine[] {
          return items.map((item: BudgetLine) => {
            const { comment, ...rest } = item;
            return {
              ...rest,
              subItems: item.subItems ? cleanItems(item.subItems) : []
            };
          });
        }
        const cleanedBudget = cleanComments(currentBudget);
        
        set(state => ({
          budgets: {
            ...state.budgets,
            [quoteId]: {
              ...budgetData,
              workBudget: JSON.parse(JSON.stringify(cleanedBudget)),
              isWorkBudgetActive: true,
              lastSaved: new Date()
            }
          }
        }));

        // Save to Supabase immediately
        get().updateBudget(quoteId, cleanedBudget, true);
      },

      resetWorkBudget: (quoteId) => {
        set(state => ({
          budgets: {
            ...state.budgets,
            [quoteId]: {
              ...state.budgets[quoteId],
              workBudget: [],
              isWorkBudgetActive: false,
              lastSaved: new Date()
            }
          }
        }));
        
        // If online, delete work budget from Supabase
        if (navigator.onLine) {
          try {
            supabase
              .from('quote_work_budgets')
              .delete()
              .eq('quote_id', quoteId)
              .then(({ error }) => {
                if (error) {
                  console.error('Error deleting work budget from Supabase:', error);
                }
              });
          } catch (error) {
            console.error('Error resetting work budget in Supabase:', error);
          }
        }
      },

      addWorkItem: (quoteId, categoryId, parentId, type, settings) => {
        console.log('addWorkItem called:', { quoteId, categoryId, parentId, type });
        const state = get();
        const budgetData = state.budgets[quoteId] || {
          budget: [],
          workBudget: [],
          isWorkBudgetActive: false,
          lastSaved: new Date()
        };
        let safeCurrentBudget = Array.isArray(budgetData.workBudget) ? budgetData.workBudget : [];
        // Cas spécial : workBudget vide et on veut ajouter un poste
        if ((type === 'post' || type === 'subPost') && safeCurrentBudget.length === 0) {
          const rootCategoryId = 'root-added-posts';
          safeCurrentBudget = [{
            id: rootCategoryId,
            name: 'Postes ajoutés',
            isExpanded: true,
            items: []
          }];
          categoryId = rootCategoryId;
        }
        const newItem = createBudgetItem(type, parentId, settings, safeCurrentBudget, categoryId, true);
        let updatedBudget;
        if (type === 'category') {
          updatedBudget = [
            ...safeCurrentBudget,
            {
              id: newItem.id,
              name: newItem.name,
              isExpanded: true,
              items: []
            }
          ];
        } else if (type === 'subCategory') {
          updatedBudget = safeCurrentBudget.map(category => {
            if (category.id !== categoryId) return category;
            return {
              ...category,
              items: [
                ...(Array.isArray(category.items) ? category.items : []),
                {
                  id: newItem.id,
                  type: 'subCategory',
                  name: newItem.name,
                  isExpanded: true,
                  subItems: [],
                  items: [],
                  quantity: 0,
                  number: 0,
                  unit: '-',
                  rate: 0,
                  socialCharges: '',
                  agencyPercent: settings.defaultAgencyPercent ?? 10,
                  marginPercent: settings.defaultMarginPercent ?? 15
                }
              ]
            };
          });
        } else if (type === 'post' || type === 'subPost') {
          updatedBudget = safeCurrentBudget.map(category => {
            if (category.id !== categoryId) return category;
            const addToItems = (items) => {
              if (!parentId) {
                return [...(Array.isArray(items) ? items : []), newItem];
              }
              return (Array.isArray(items) ? items : []).map(item => {
                if (item.id === parentId) {
                  return {
                    ...item,
                    subItems: [...(Array.isArray(item.subItems) ? item.subItems : []), newItem],
                    isExpanded: true
                  };
                }
                if (item.subItems) {
                  return { ...item, subItems: addToItems(item.subItems) };
                }
                return item;
              });
            };
            return { ...category, items: addToItems(category.items || []) };
          });
        } else {
          updatedBudget = safeCurrentBudget;
        }
        set(state => ({
          budgets: {
            ...state.budgets,
            [quoteId]: {
              ...budgetData,
              workBudget: JSON.parse(JSON.stringify(updatedBudget)),
              isWorkBudgetActive: true,
              lastSaved: new Date()
            }
          }
        }));
        console.log('State updated, new workBudget:', get().budgets[quoteId]?.workBudget);

        // Save to Supabase immediately
        get().updateBudget(quoteId, updatedBudget, true);
      },

      updateWorkItem: (quoteId, categoryId, itemId, updates) => {
        const state = get();
        const budgetData = state.budgets[quoteId] || {
          budget: [],
          workBudget: [],
          isWorkBudgetActive: false,
          lastSaved: new Date()
        };
        const safeCurrentBudget = Array.isArray(budgetData.workBudget) ? budgetData.workBudget : [];
        const updatedBudget = safeCurrentBudget.map(category => {
          if (category.id !== categoryId) return category;
          const updateItems = (items) => {
            return (Array.isArray(items) ? items : []).map(item => {
              if (item.id === itemId) {
                return { ...item, ...updates };
              }
              if (item.subItems) {
                return { ...item, subItems: updateItems(item.subItems) };
              }
              return item;
            });
          };
          return { ...category, items: updateItems(category.items || []) };
        });
        set(state => ({
          budgets: {
            ...state.budgets,
            [quoteId]: {
              ...budgetData,
              workBudget: JSON.parse(JSON.stringify(updatedBudget)),
              lastSaved: new Date()
            }
          }
        }));

        // Save to Supabase immediately
        get().updateBudget(quoteId, updatedBudget, true);
      },

      deleteWorkItem: (quoteId, categoryId, itemId) => {
        const state = get();
        const budgetData = state.budgets[quoteId] || {
          budget: [],
          workBudget: [],
          isWorkBudgetActive: false,
          lastSaved: new Date()
        };
        const safeCurrentBudget = Array.isArray(budgetData.workBudget) ? budgetData.workBudget : [];
        let updatedBudget;
        if (categoryId === itemId) {
          updatedBudget = safeCurrentBudget.filter(category => category.id !== categoryId || category.id === 'social-charges');
        } else {
          updatedBudget = safeCurrentBudget.map(category => {
            if (category.id !== categoryId) return category;
            const deleteFromItems = (items) => {
              return (Array.isArray(items) ? items : []).filter(item => {
                if (item.id === itemId) return false;
                if (item.subItems) {
                  item.subItems = deleteFromItems(item.subItems);
                }
                return true;
              });
            };
            return { ...category, items: deleteFromItems(category.items || []) };
          });
        }
        set(state => ({
          budgets: {
            ...state.budgets,
            [quoteId]: {
              ...budgetData,
              workBudget: JSON.parse(JSON.stringify(updatedBudget)),
              lastSaved: new Date()
            }
          }
        }));

        // Save to Supabase immediately
        get().updateBudget(quoteId, updatedBudget, true);
      },

      updateWorkCategory: (quoteId, categoryId, updates) => {
        const state = get();
        const budgetData = state.budgets[quoteId] || {
          budget: [],
          workBudget: [],
          isWorkBudgetActive: false,
          lastSaved: new Date()
        };
        const safeCurrentBudget = Array.isArray(budgetData.workBudget) ? budgetData.workBudget : [];
        const updatedBudget = safeCurrentBudget.map(category =>
          category.id === categoryId ? { ...category, ...updates } : category
        );
        set(state => ({
          budgets: {
            ...state.budgets,
            [quoteId]: {
              ...budgetData,
              workBudget: JSON.parse(JSON.stringify(updatedBudget)),
              lastSaved: new Date()
            }
          }
        }));

        // Save to Supabase immediately
        get().updateBudget(quoteId, updatedBudget, true);
      }
    }),
    {
      name: 'budget-storage',
      version: 1
    }
  )
);

export function useBudgetState() {
  return useBudgetStore();
}