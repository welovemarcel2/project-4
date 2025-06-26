import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';
import { Quote, QuoteType, QuoteStatus } from '../types/project';
import { BudgetCategory } from '../types/budget';
import { SyncManager } from '../utils/syncManager';
import { QuoteStorage } from '../utils/quoteStorage';
import { useExpenseCategoriesStore } from '../stores/expenseCategoriesStore';
import { QuoteSettings } from '../types/quoteSettings';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface QuoteState {
  quotes: Quote[];
  quotesData: Record<string, {
    quote: Quote;
    budget: BudgetCategory[];
    workBudget: BudgetCategory[];
  }>;
  isLoading: boolean;
  error: string | null;
  loadQuotes: (projectId: string, projectSettings?: any) => Promise<void>;
  createQuote: (data: { 
    projectId: string;
    name: string;
    type: QuoteType;
    parentQuoteId?: string;
    initialBudget?: BudgetCategory[];
    settings?: Partial<QuoteSettings>;
  }) => Promise<Quote>;
  updateQuoteStatus: (quoteId: string, status: QuoteStatus, details?: { rejectionReason?: string }) => Promise<void>;
  updateQuoteParent: (quoteId: string, newParentId: string) => Promise<void>;
  updateQuoteBudget: (quoteId: string, budget: BudgetCategory[]) => Promise<void>;
  updateQuoteWorkBudget: (quoteId: string, workBudget: BudgetCategory[]) => Promise<void>;
  getQuoteBudget: (quoteId: string | null) => BudgetCategory[];
  getQuoteWorkBudget: (quoteId: string | null) => BudgetCategory[];
  getProjectQuotes: (projectId: string) => Quote[];
  deleteQuote: (quoteId: string) => Promise<void>;
}

export const useQuoteStore = create<QuoteState>()(
  persist(
    (set, get) => ({
      quotes: [],
      quotesData: {},
      isLoading: false,
      error: null,

      loadQuotes: async (projectId, projectSettings) => {
        if (!projectId) {
          console.warn('Cannot load quotes: projectId is undefined');
          return;
        }

        if (get().isLoading) {
          return;
        }

        try {
          set({ isLoading: true, error: null });

          if (!navigator.onLine) {
            const storedQuotes = QuoteStorage.getAllQuotes();
            const projectQuotes = Object.values(storedQuotes)
              .filter(data => {
                return data.quote.projectId === projectId && !data.quote.is_deleted;
              })
              .map(data => ({
                ...data.quote,
                isOffline: true
              }));

            set({ 
              quotes: projectQuotes,
              quotesData: Object.fromEntries(
                Object.entries(storedQuotes)
                  .filter(([_, data]) => data.quote.projectId === projectId && !data.quote.is_deleted)
              ),
              isLoading: false 
            });
            return;
          }

          const { data: quotes, error: quotesError } = await supabase
            .from('quotes')
            .select('*')
            .eq('project_id', projectId)
            .eq('is_deleted', false);

          if (quotesError) throw quotesError;

          const quotesData: Record<string, {
            quote: Quote;
            budget: BudgetCategory[];
            workBudget: BudgetCategory[];
          }> = {};

          // Create a promise array to load all quote data in parallel
          const loadPromises = [];
          for (const quote of quotes) {
            // Create a promise for loading each quote's data
            const loadQuoteDataPromise = (async () => {
              const [
                { data: budgetData },
                { data: workBudgetData },
                { data: displayData }
              ] = await Promise.all([
                supabase
                  .from('quote_budgets')
                  .select('budget_data')
                  .eq('quote_id', quote.id)
                  .maybeSingle(),
                supabase
                  .from('quote_work_budgets')
                  .select('budget_data, comments')
                  .eq('quote_id', quote.id)
                  .maybeSingle(),
                supabase
                  .from('quote_displays')
                  .select('*')
                  .eq('quote_id', quote.id)
                  .maybeSingle()
              ]);

              const status = quote.status || 'draft';

              quotesData[quote.id] = {
                quote: {
                  id: quote.id,
                  projectId: quote.project_id,
                  name: quote.name,
                  type: quote.type,
                  parentQuoteId: quote.parent_quote_id,
                  status: status,
                  version: quote.version,
                  createdAt: new Date(quote.created_at),
                  updatedAt: new Date(quote.updated_at),
                  validatedAt: quote.validated_at ? new Date(quote.validated_at) : undefined,
                  rejectedAt: quote.rejected_at ? new Date(quote.rejected_at) : undefined,
                  rejectionReason: quote.rejection_reason,
                  is_deleted: quote.is_deleted,
                  displaysId: quote.displays_id,
                  numberingsId: quote.numberings_id,
                  unitsId: quote.units_id,
                  displays: displayData ? {
                    id: displayData.id,
                    quoteId: displayData.quote_id,
                    showEmptyItems: displayData.show_empty_items,
                    socialChargesDisplay: displayData.social_charges_display,
                    applySocialChargesMargins: displayData.apply_social_charges_margins,
                    createdAt: new Date(displayData.created_at),
                    updatedAt: new Date(displayData.updated_at)
                  } : undefined
                },
                budget: budgetData?.budget_data || [],
                workBudget: workBudgetData?.budget_data || []
              };

              // Apply comments to budget items if they exist
              if (workBudgetData?.comments) {
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

                if (quotesData[quote.id].workBudget.length > 0) {
                  quotesData[quote.id].workBudget = quotesData[quote.id].workBudget.map(category => ({
                    ...category,
                    items: applyComments(category.items)
                  }));
                }
              }

              await QuoteStorage.saveQuote(quote.id, {
                ...quotesData[quote.id],
                lastModified: Date.now()
              });
              
              // Load expense categories for this quote
              return useExpenseCategoriesStore.getState().loadCategories(quote.id);
            })();
            
            loadPromises.push(loadQuoteDataPromise);
          }

          // Wait for all quote data to be loaded
          await Promise.all(loadPromises);

          const currentState = get();
          
          const updatedQuotes = [
            ...currentState.quotes.filter(q => q.projectId !== projectId),
            ...Object.values(quotesData).map(data => data.quote)
          ];
          
          const updatedQuotesData = {
            ...currentState.quotesData,
            ...quotesData
          };

          set({ 
            quotes: updatedQuotes,
            quotesData: updatedQuotesData,
            isLoading: false 
          });
        } catch (error) {
          console.error('Error loading quotes:', error);
          set({ error: 'Error loading quotes', isLoading: false });
        }
      },

      createQuote: async (data) => {
        try {
          const { data: newQuote, error } = await supabase
            .from('quotes')
            .insert([{
              project_id: data.projectId,
              name: data.name,
              type: data.type,
              parent_quote_id: data.parentQuoteId,
              status: 'draft',
              version: 1,
              is_deleted: false
            }])
            .select()
            .single();

          if (error) throw error;

          let displayData = null;
          if (data.settings) {
            console.log("Creating quote display settings:", data.settings);
            const { data: displayResult, error: displayError } = await supabase
              .from('quote_displays')
              .insert([{
                quote_id: newQuote.id,
                show_empty_items: data.settings.showEmptyItems !== undefined ? data.settings.showEmptyItems : true,
                social_charges_display: data.settings.socialChargesDisplay || 'detailed',
                apply_social_charges_margins: data.settings.applySocialChargesMargins !== undefined ? data.settings.applySocialChargesMargins : false
              }])
              .select()
              .single();

            if (displayError) {
              console.error('Error creating quote display settings:', displayError);
            } else {
              displayData = displayResult;
              console.log("Created display settings:", displayData);
              
              const { error: updateError } = await supabase
                .from('quotes')
                .update({ displays_id: displayData.id })
                .eq('id', newQuote.id);

              if (updateError) {
                console.error('Error updating quote with display settings reference:', updateError);
              }
            }
          }

          const quote: Quote = {
            id: newQuote.id,
            projectId: newQuote.project_id,
            name: newQuote.name,
            type: newQuote.type,
            parentQuoteId: newQuote.parent_quote_id,
            status: 'draft',
            version: 1,
            createdAt: new Date(newQuote.created_at),
            updatedAt: new Date(newQuote.updated_at),
            is_deleted: false,
            displaysId: displayData?.id,
            displays: displayData ? {
              id: displayData.id,
              quoteId: displayData.quote_id,
              showEmptyItems: displayData.show_empty_items,
              socialChargesDisplay: displayData.social_charges_display,
              applySocialChargesMargins: displayData.apply_social_charges_margins,
              createdAt: new Date(displayData.created_at),
              updatedAt: new Date(displayData.updated_at)
            } : undefined
          };

          const currentState = get();
          set({
            quotes: [...currentState.quotes, quote],
            quotesData: {
              ...currentState.quotesData,
              [quote.id]: {
                quote,
                budget: data.initialBudget || [],
                workBudget: []
              }
            }
          });

          // If initial budget is provided, save it
          if (data.initialBudget && data.initialBudget.length > 0) {
            await get().updateQuoteBudget(quote.id, data.initialBudget);
          }

          return quote;
        } catch (error) {
          console.error('Error creating quote:', error);
          throw error;
        }
      },

      updateQuoteStatus: async (quoteId, status, details) => {
        try {
          const updateData: any = {
            status,
            validated_at: status === 'validated' ? new Date().toISOString() : null,
            rejected_at: status === 'rejected' ? new Date().toISOString() : null,
            rejection_reason: details?.rejectionReason
          };

          const { error } = await supabase
            .from('quotes')
            .update(updateData)
            .eq('id', quoteId);

          if (error) throw error;

          const currentState = get();
          const quoteData = currentState.quotesData[quoteId];

          if (quoteData) {
            const updatedQuote = {
              ...quoteData.quote,
              status,
              validatedAt: status === 'validated' ? new Date() : undefined,
              rejectedAt: status === 'rejected' ? new Date() : undefined,
              rejectionReason: details?.rejectionReason
            };

            set({
              quotes: currentState.quotes.map(q => 
                q.id === quoteId ? updatedQuote : q
              ),
              quotesData: {
                ...currentState.quotesData,
                [quoteId]: {
                  ...quoteData,
                  quote: updatedQuote
                }
              }
            });
          }
        } catch (error) {
          console.error('Error updating quote status:', error);
          throw error;
        }
      },

      updateQuoteParent: async (quoteId, newParentId) => {
        try {
          const { error } = await supabase
            .from('quotes')
            .update({ parent_quote_id: newParentId })
            .eq('id', quoteId);

          if (error) throw error;

          const currentState = get();
          const quoteData = currentState.quotesData[quoteId];

          if (quoteData) {
            const updatedQuote = {
              ...quoteData.quote,
              parentQuoteId: newParentId
            };

            set({
              quotes: currentState.quotes.map(q => 
                q.id === quoteId ? updatedQuote : q
              ),
              quotesData: {
                ...currentState.quotesData,
                [quoteId]: {
                  ...quoteData,
                  quote: updatedQuote
                }
              }
            });
          }
        } catch (error) {
          console.error('Error updating quote parent:', error);
          throw error;
        }
      },

      updateQuoteBudget: async (quoteId, budget) => {
        try {
          console.log('Updating budget for quote:', quoteId);
          
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
          
          budget.forEach(category => {
            extractComments(category.items);
          });

          // Use upsert operation to handle both insert and update cases
          const { error } = await supabase
            .from('quote_budgets')
            .upsert({ 
              quote_id: quoteId,
              budget_data: budget
            }, {
              onConflict: 'quote_id'
            });

          if (error) {
            console.error('Error updating budget in Supabase:', error);
            throw error;
          }

          console.log('Budget updated successfully in Supabase');

          const currentState = get();
          const quoteData = currentState.quotesData[quoteId];

          if (quoteData) {
            set({
              quotesData: {
                ...currentState.quotesData,
                [quoteId]: {
                  ...quoteData,
                  budget
                }
              }
            });
          }

          // Save to local storage for offline access
          const storedQuote = QuoteStorage.getQuote(quoteId);
          if (storedQuote) {
            QuoteStorage.saveQuote(quoteId, {
              ...storedQuote,
              budget,
              lastModified: Date.now()
            });
          }
        } catch (error) {
          console.error('Error updating quote budget:', error);
          throw error;
        }
      },

      updateQuoteWorkBudget: async (quoteId, workBudget) => {
        try {
          // Deep clone the budget to ensure we're working with a fresh copy
          const clonedWorkBudget = JSON.parse(JSON.stringify(workBudget));
          
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
          
          clonedWorkBudget.forEach(category => {
            extractComments(category.items);
          });

          // Use upsert operation with onConflict option to handle the unique constraint
          const { error } = await supabase
            .from('quote_work_budgets')
            .upsert({ 
              quote_id: quoteId,
              budget_data: clonedWorkBudget,
              comments: comments
            }, {
              onConflict: 'quote_id'
            });

          if (error) throw error;

          const currentState = get();
          const quoteData = currentState.quotesData[quoteId];

          if (quoteData) {
            set({
              quotesData: {
                ...currentState.quotesData,
                [quoteId]: {
                  ...quoteData,
                  workBudget: clonedWorkBudget
                }
              }
            });
          }

          // Save to local storage for offline access
          const storedQuote = QuoteStorage.getQuote(quoteId);
          if (storedQuote) {
            QuoteStorage.saveQuote(quoteId, {
              ...storedQuote,
              workBudget: clonedWorkBudget,
              lastModified: Date.now()
            });
          }
        } catch (error) {
          console.error('Error updating quote work budget:', error);
          throw error;
        }
      },

      getQuoteBudget: (quoteId) => {
        if (!quoteId) return [];
        return get().quotesData[quoteId]?.budget || [];
      },

      getQuoteWorkBudget: (quoteId) => {
        if (!quoteId) return [];
        return get().quotesData[quoteId]?.workBudget || [];
      },

      getProjectQuotes: (projectId) => {
        return get().quotes.filter(quote => quote.projectId === projectId);
      },

      deleteQuote: async (quoteId) => {
        try {
          const { error } = await supabase
            .from('quotes')
            .update({ is_deleted: true })
            .eq('id', quoteId);

          if (error) throw error;

          const currentState = get();
          set({
            quotes: currentState.quotes.filter(q => q.id !== quoteId),
            quotesData: Object.fromEntries(
              Object.entries(currentState.quotesData)
                .filter(([id]) => id !== quoteId)
            )
          });
        } catch (error) {
          console.error('Error deleting quote:', error);
          throw error;
        }
      }
    }),
    {
      name: 'quotes-storage',
      storage: localStorage,
      version: 1,
      partialize: (state) => ({
        quotes: state.quotes,
        quotesData: state.quotesData
      })
    }
  )
);

export function useQuotes() {
  return useQuoteStore();
}