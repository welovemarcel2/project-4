import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BudgetCategory, BudgetLine, BudgetItemType } from '../types/budget';
import { QuoteSettings } from '../types/quoteSettings';
import { createBudgetItem } from '../utils/budget/itemCreation';
import { SyncManager } from '../utils/syncManager';
import { createClient } from '@supabase/supabase-js';

// Initialisation du client Supabase
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
  updateBudget: (quoteId: string, newBudget: BudgetCategory[] | null | undefined, isWorkBudget?: boolean) => Promise<void>;
  addItem: (quoteId: string, categoryId: string | null, parentId: string | null, type: BudgetItemType, settings: QuoteSettings, isWorkBudget?: boolean) => Promise<void>;
  updateItem: (quoteId: string, categoryId: string, itemId: string, updates: Partial<BudgetLine>, saveToBackend?: boolean) => Promise<void>;
  deleteItem: (quoteId: string, categoryId: string, itemId: string, isWorkBudget?: boolean) => Promise<void>;
  updateCategory: (quoteId: string, categoryId: string, updates: Partial<BudgetCategory>, isWorkBudget?: boolean) => Promise<void>;
  initializeWorkBudget: (quoteId: string) => void;
  resetWorkBudget: (quoteId: string) => void;
  loadWorkBudget: (quoteId: string) => Promise<void>;
  addWorkItem: (quoteId: string, categoryId: string, parentId: string, type: BudgetItemType, settings: QuoteSettings) => void;
  updateWorkItem: (quoteId: string, categoryId: string, itemId: string, updates: Partial<BudgetLine>) => void;
  deleteWorkItem: (quoteId: string, categoryId: string, itemId: string) => void;
  updateWorkCategory: (quoteId: string, categoryId: string, updates: Partial<BudgetCategory>) => void;
  _debugGetBudgetState: () => Record<string, BudgetData>; // Pour debugging
}

// Pour le débogage - compte le nombre d'opérations Supabase
const debugStats = {
  syncAttempts: 0,
  syncSuccesses: 0,
  syncFailures: 0,
  lastSyncTime: 0
};

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      budgets: {},

      _debugGetBudgetState: () => {
        return get().budgets;
      },

      initializeBudget: (quoteId, isAdditive) => {
        console.log(`[BudgetStore] Initializing budget for quote ${quoteId}`);
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
        return Array.isArray(budget) ? JSON.parse(JSON.stringify(budget)) : [];
      },

      getWorkBudget: (quoteId) => {
        const workBudget = get().budgets[quoteId]?.workBudget;
        return Array.isArray(workBudget) ? JSON.parse(JSON.stringify(workBudget)) : [];
      },

      isWorkBudgetActive: (quoteId) => {
        return get().budgets[quoteId]?.isWorkBudgetActive || false;
      },

      loadWorkBudget: async (quoteId) => {
        try {
          // Vérifier si un budget de travail existe pour ce devis
          console.log('[BudgetStore] Loading work budget for quote:', quoteId);
          const { data: workBudgetData, error } = await supabase
            .from('quote_work_budgets')
            .select('budget_data, comments')
            .eq('quote_id', quoteId)
            .maybeSingle();

          if (error) {
            console.error('[BudgetStore] Error loading work budget:', error);
            return;
          }

          if (workBudgetData) {
            // Appliquer les commentaires aux items de budget s'ils existent
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

            // Mettre à jour le store avec le budget de travail chargé
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

            console.log('[BudgetStore] Work budget loaded successfully for quote:', quoteId);
          } else {
            console.log('[BudgetStore] No work budget found for quote:', quoteId);
          }
        } catch (error) {
          console.error('[BudgetStore] Error loading work budget:', error);
        }
      },

      updateBudget: async (quoteId, newBudget, isWorkBudget = false) => {
        const validatedBudget = Array.isArray(newBudget) ? newBudget : [];
        
        // Créer une copie profonde des données de budget
        const budgetData = JSON.parse(JSON.stringify(get().budgets[quoteId] || { 
          budget: [], 
          workBudget: [], 
          isWorkBudgetActive: false,
          lastSaved: new Date()
        }));

        // Deep clone du budget pour éviter les problèmes de référence
        const clonedBudget = JSON.parse(JSON.stringify(validatedBudget));
        
        debugStats.syncAttempts++;
        debugStats.lastSyncTime = Date.now();

        try {
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
              return;
            }

            try {
              // Extraire les commentaires des items de budget pour un stockage séparé
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

              // Utiliser upsert pour gérer à la fois les cas d'insertion et de mise à jour
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
                console.error('[BudgetStore] Error updating work budget in Supabase:', error);
                debugStats.syncFailures++;
                throw error;
              } else {
                console.log('[BudgetStore] Work budget updated successfully in Supabase for quote:', quoteId);
                debugStats.syncSuccesses++;
              }
            } catch (error) {
              console.error('[BudgetStore] Error syncing work budget with Supabase:', error);
              debugStats.syncFailures++;
              throw error;
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
              return;
            }

            try {
              console.log('[BudgetStore] Saving budget to Supabase for quote:', quoteId);
              console.log('[BudgetStore] Budget data:', JSON.stringify(validatedBudget).substring(0, 200) + '...');
              
              // Utiliser upsert pour les mises à jour de budget normales aussi
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
                console.error('[BudgetStore] Error updating budget in Supabase:', error);
                debugStats.syncFailures++;
                throw error;
              } else {
                console.log('[BudgetStore] Budget updated successfully in Supabase for quote:', quoteId);
                debugStats.syncSuccesses++;
              }
            } catch (error) {
              console.error('[BudgetStore] Error syncing budget with Supabase:', error);
              debugStats.syncFailures++;
              throw error;
            }
          }
        } catch (error) {
          console.error('[BudgetStore] Error in updateBudget:', error);
          throw error;
        }
      },

      addItem: async (quoteId, categoryId, parentId, type, settings, isWorkBudget = false) => {
        console.log(`[BudgetStore] Adding new item: type=${type}, categoryId=${categoryId}, parentId=${parentId}, isWorkBudget=${isWorkBudget}`);
        
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

          // Sauvegarder immédiatement dans Supabase
          await get().updateBudget(quoteId, updatedBudget, isWorkBudget);
          console.log(`[BudgetStore] Item added and saved to Supabase for quote: ${quoteId}, type: ${type}, id: ${newItem.id}`);
          
          // Retourner l'ID du nouvel item pour les références futures si nécessaire
          return newItem.id;
        } catch (error) {
          console.error('[BudgetStore] Error adding item:', error);
          throw error;
        }
      },

      updateItem: async (quoteId, categoryId, itemId, updates, saveToBackend = true) => {
        console.log('[BudgetStore] Updating item for quote:', quoteId, 'category:', categoryId, 'item:', itemId);
        console.log('[BudgetStore] Updates:', updates);
        
        const state = get();
        
        // Deep clone pour éviter les problèmes de référence
        const budgetData = JSON.parse(JSON.stringify(state.budgets[quoteId] || {
          budget: [],
          workBudget: [], 
          isWorkBudgetActive: false,
          lastSaved: new Date()
        }));

        // Déterminer si nous travaillons avec le budget de travail
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

          // Détecter si le nom a été modifié pour un log spécifique
          const nameChanged = updates.name !== undefined;
          if (nameChanged) {
            console.log(`[BudgetStore] Updating item name to: "${updates.name}"`);
          }

          const updatedBudget = safeCurrentBudget.map(category => {
            if (category.id !== categoryId) return category;

            const updateItems = (items: BudgetLine[]): BudgetLine[] => {
              return (Array.isArray(items) ? items : []).map(item => {
                if (item.id === itemId) {
                  const updatedItem = { ...item, ...updates };
                  console.log(`[BudgetStore] Item updated: ${itemId}, name: ${updatedItem.name}`);
                  return updatedItem;
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

          // Sauvegarder dans Supabase si demandé
          if (saveToBackend) {
            await get().updateBudget(quoteId, updatedBudget, isWorkBudget);
            console.log(`[BudgetStore] Item updated and saved to Supabase for quote: ${quoteId}, item: ${itemId}`);
          } else {
            console.log(`[BudgetStore] Item updated locally only (not saved to Supabase): ${itemId}`);
          }
        } catch (error) {
          console.error('[BudgetStore] Error updating item:', error);
          throw error;
        }
      },

      deleteItem: async (quoteId, categoryId, itemId, isWorkBudget = false) => {
        console.log(`[BudgetStore] Deleting item: ${itemId}, categoryId: ${categoryId}, isWorkBudget: ${isWorkBudget}`);
        
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
          // Si on supprime une catégorie entière
          updatedBudget = safeCurrentBudget.filter(category => 
            category.id !== categoryId || category.id === 'social-charges'
          );
          console.log(`[BudgetStore] Category deleted: ${categoryId}`);
        } else {
          // Si on supprime un item ou sous-item
          updatedBudget = safeCurrentBudget.map(category => {
            if (category.id !== categoryId) return category;

            const deleteFromItems = (items: BudgetLine[]): BudgetLine[] => {
              return (Array.isArray(items) ? items : []).filter(item => {
                if (item.id === itemId) {
                  console.log(`[BudgetStore] Item deleted: ${itemId}, name: ${item.name}`);
                  return false;
                }
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

        // Sauvegarder immédiatement dans Supabase
        await get().updateBudget(quoteId, updatedBudget, isWorkBudget);
        console.log(`[BudgetStore] Item deleted and saved to Supabase for quote: ${quoteId}, item: ${itemId}`);
      },

      updateCategory: async (quoteId, categoryId, updates, isWorkBudget = false) => {
        console.log(`[BudgetStore] Updating category: ${categoryId}, updates:`, updates);
        
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

        // Sauvegarder immédiatement dans Supabase
        await get().updateBudget(quoteId, updatedBudget, isWorkBudget);
        console.log(`[BudgetStore] Category updated and saved to Supabase for quote: ${quoteId}, category: ${categoryId}`);
      },

      initializeWorkBudget: (quoteId) => {
        console.log(`[BudgetStore] Initializing work budget for quote: ${quoteId}`);
        
        const state = get();
        const budgetData = state.budgets[quoteId] || {
          budget: [],
          workBudget: [],
          isWorkBudgetActive: false,
          lastSaved: new Date()
        };
        
        if (Array.isArray(budgetData.workBudget) && budgetData.workBudget.length > 0) {
          console.log(`[BudgetStore] Work budget already exists for quote: ${quoteId}`);
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

        // Sauvegarder immédiatement dans Supabase
        get().updateBudget(quoteId, cleanedBudget, true);
        console.log(`[BudgetStore] Work budget initialized and saved to Supabase for quote: ${quoteId}`);
      },

      resetWorkBudget: (quoteId) => {
        console.log(`[BudgetStore] Resetting work budget for quote: ${quoteId}`);
        
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
        
        // Si en ligne, supprimer le budget de travail de Supabase
        if (navigator.onLine) {
          try {
            console.log(`[BudgetStore] Deleting work budget from Supabase for quote: ${quoteId}`);
            supabase
              .from('quote_work_budgets')
              .delete()
              .eq('quote_id', quoteId)
              .then(({ error }) => {
                if (error) {
                  console.error('[BudgetStore] Error deleting work budget from Supabase:', error);
                } else {
                  console.log(`[BudgetStore] Work budget successfully deleted from Supabase for quote: ${quoteId}`);
                }
              });
          } catch (error) {
            console.error('[BudgetStore] Error resetting work budget in Supabase:', error);
          }
        } else {
          console.log(`[BudgetStore] Offline: work budget deletion from Supabase queued for quote: ${quoteId}`);
          SyncManager.getInstance().addPendingSync({
            id: quoteId,
            type: 'budget',
            operation: 'delete',
            data: { quoteId, isWorkBudget: true }
          });
        }
      },

      addWorkItem: (quoteId, categoryId, parentId, type, settings) => {
        console.log(`[BudgetStore] Adding work item: quoteId=${quoteId}, categoryId=${categoryId}, parentId=${parentId}, type=${type}`);
        
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
        console.log(`[BudgetStore] New work item created: ${newItem.id}, ${newItem.name}`);
        
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
        
        console.log('[BudgetStore] State updated, new workBudget:', get().budgets[quoteId]?.workBudget);

        // Sauvegarder immédiatement dans Supabase
        get().updateBudget(quoteId, updatedBudget, true);
      },

      updateWorkItem: (quoteId, categoryId, itemId, updates) => {
        console.log(`[BudgetStore] Updating work item: ${itemId}, updates:`, updates);
        
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

        // Sauvegarder immédiatement dans Supabase
        get().updateBudget(quoteId, updatedBudget, true);
      },

      deleteWorkItem: (quoteId, categoryId, itemId) => {
        console.log(`[BudgetStore] Deleting work item: ${itemId}, categoryId: ${categoryId}`);
        
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

        // Sauvegarder immédiatement dans Supabase
        get().updateBudget(quoteId, updatedBudget, true);
      },

      updateWorkCategory: (quoteId, categoryId, updates) => {
        console.log(`[BudgetStore] Updating work category: ${categoryId}, updates:`, updates);
        
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

        // Sauvegarder immédiatement dans Supabase
        get().updateBudget(quoteId, updatedBudget, true);
      }
    }),
    {
      name: 'budget-storage',
      version: 2,
      migrate: (persistedState, version) => {
        // Migration de la version 1 vers la version 2
        if (version === 1) {
          console.log('[BudgetStore] Migrating from version 1 to 2');
          
          const newState = {
            ...persistedState,
            // Ajoutez ici toute logique de migration nécessaire
          };
          
          return newState;
        }
        return persistedState;
      },
      onRehydrateStorage: (state) => {
        // Fonction appelée après la réhydratation du state depuis localStorage
        return (rehydratedState, error) => {
          if (error) {
            console.error('[BudgetStore] Error rehydrating state:', error);
          } else if (rehydratedState) {
            console.log('[BudgetStore] State rehydrated successfully');
            
            // Vérifier que tous les budgets ont le format attendu
            Object.entries(rehydratedState.budgets).forEach(([quoteId, data]) => {
              if (!Array.isArray(data.budget)) {
                console.warn(`[BudgetStore] Invalid budget format for quote ${quoteId}, resetting to empty array`);
                data.budget = [];
              }
              if (!Array.isArray(data.workBudget)) {
                console.warn(`[BudgetStore] Invalid work budget format for quote ${quoteId}, resetting to empty array`);
                data.workBudget = [];
              }
            });
          }
        };
      }
    }
  )
);

export function useBudgetState() {
  return useBudgetStore();
}