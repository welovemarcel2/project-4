import { useEffect, useState } from 'react';
import { Quote } from '../types/project';
import { BudgetCategory } from '../types/budget';
import { QuoteStorage } from '../utils/quoteStorage';
import { SyncManager } from '../utils/syncManager';

export function useQuoteSync(quoteId: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!quoteId) return;

    const syncStatus = SyncManager.getInstance().getStatus();
    
    // If we're offline, load from local storage
    if (!syncStatus.isOnline) {
      const storedQuote = QuoteStorage.getQuote(quoteId);
      if (storedQuote) {
        return;
      }
    }
  }, [quoteId]);

  const saveQuote = async (
    quote: Quote,
    budget: BudgetCategory[],
    workBudget: BudgetCategory[]
  ) => {
    if (!quoteId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Save to local storage first
      QuoteStorage.saveQuote(quoteId, {
        quote,
        budget,
        workBudget,
        lastModified: Date.now()
      });

      // If online, sync with Supabase
      const syncStatus = SyncManager.getInstance().getStatus();
      if (syncStatus.isOnline) {
        SyncManager.getInstance().addPendingSync({
          id: quoteId,
          type: 'quote',
          operation: 'update',
          data: {
            quote,
            budget,
            workBudget
          }
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save quote'));
      console.error('Error saving quote:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    saveQuote
  };
}