import { Quote } from '../types/project';
import { BudgetCategory } from '../types/budget';

interface StoredQuote {
  quote: Quote;
  budget: BudgetCategory[];
  workBudget: BudgetCategory[];
  lastModified: number;
}

export class QuoteStorage {
  private static STORAGE_KEY = 'quotes';

  static async saveQuote(quoteId: string, data: StoredQuote): Promise<void> {
    try {
      // Validate data before saving
      if (!data.quote || !Array.isArray(data.budget) || !Array.isArray(data.workBudget)) {
        throw new Error('Invalid quote data structure');
      }

      // Ensure quote has a status
      if (!data.quote.status) {
        data.quote.status = 'draft';
      }

      // Get all quotes
      const quotes = this.getAllQuotes();
      
      // Update or add the quote
      quotes[quoteId] = {
        ...data,
        lastModified: Date.now()
      };

      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quotes));
    } catch (error) {
      console.error('Error saving quote to local storage:', error);
      throw error;
    }
  }

  static getQuote(quoteId: string): StoredQuote | null {
    try {
      const quotes = this.getAllQuotes();
      const quote = quotes[quoteId];
      
      if (!quote) return null;

      // Ensure quote has a status
      if (!quote.quote.status) {
        quote.quote.status = 'draft';
      }

      return {
        ...quote,
        quote: { ...quote.quote, isOffline: !navigator.onLine },
        budget: Array.isArray(quote.budget) ? quote.budget : [],
        workBudget: Array.isArray(quote.workBudget) ? quote.workBudget : []
      };
    } catch (error) {
      console.error('Error reading quote from local storage:', error);
      return null;
    }
  }

  static removeQuote(quoteId: string): void {
    try {
      // Get all quotes
      const quotes = this.getAllQuotes();
      
      // Remove the quote and its additives
      const quoteToDelete = quotes[quoteId];
      if (!quoteToDelete) return;

      // If this is a main quote, delete all its additives
      if (quoteToDelete.quote.type === 'main') {
        Object.values(quotes).forEach(storedQuote => {
          if (storedQuote.quote.parentQuoteId === quoteId) {
            delete quotes[storedQuote.quote.id];
          }
        });
      }

      // Delete the quote itself
      delete quotes[quoteId];

      // Save updated quotes
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(quotes));
    } catch (error) {
      console.error('Error removing quote from storage:', error);
    }
  }

  static getAllQuotes(): Record<string, StoredQuote> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const quotes = data ? JSON.parse(data) : {};
      
      // Add offline indicator when offline
      if (!navigator.onLine) {
        Object.values(quotes).forEach(quote => {
          quote.quote.isOffline = true;
          
          // Ensure quote has a status
          if (!quote.quote.status) {
            quote.quote.status = 'draft';
          }
        });
      }
      
      return quotes;
    } catch (error) {
      console.error('Error reading quotes from local storage:', error);
      return {};
    }
  }

  static clearAll(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing quote storage:', error);
    }
  }
}