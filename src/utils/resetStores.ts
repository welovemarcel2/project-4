import { useUserStore } from '../stores/userStore';
import { useProjectStore } from '../hooks/useProjects';
import { useQuoteStore } from '../hooks/useQuotes';
import { useBudgetStore } from '../hooks/useBudgetState';
import { QuoteStorage } from './quoteStorage';
import { useTemplatesStore } from '../stores/templatesStore';
import { useHistoryStore } from '../stores/historyStore';
import { useExpenseCategoriesStore } from '../stores/expenseCategoriesStore';
import { useCurrencyStore } from '../stores/currencyStore';

export function resetAllStores() {
  // Reset all Zustand stores
  useUserStore.setState({ currentUser: null, users: [] });
  useProjectStore.setState({ projects: [], isLoading: false, error: null });
  useQuoteStore.setState({ quotes: [], quotesData: {}, isLoading: false, error: null });
  useBudgetStore.setState({ budgets: {} });
  useTemplatesStore.setState({ templates: [] });
  useHistoryStore.setState({ histories: {} });
  useExpenseCategoriesStore.setState({ categoriesByQuote: {}, showExpenseDistribution: false });
  useCurrencyStore.setState({ selectedCurrency: 'EUR', currencies: [] });

  // Clear all local storage
  const keysToRemove = [
    'quotes-storage',
    'budget-storage',
    'project-history',
    'currency-storage',
    'expense-categories-storage',
    'distribution-storage',
    'templates-storage',
    'user-storage',
    'projects-storage',
    'budget-templates',
    'render-storage'
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear quote storage
  QuoteStorage.clearAll();

  // Clear all session storage
  sessionStorage.clear();

  // Clear all IndexedDB databases
  window.indexedDB.databases().then(databases => {
    databases.forEach(db => {
      if (db.name) {
        window.indexedDB.deleteDatabase(db.name);
      }
    });
  });

  // Clear all cookies
  document.cookie.split(";").forEach(cookie => {
    document.cookie = cookie
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });

  // Clear all caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }

  console.log('All stores and storage cleared');
}