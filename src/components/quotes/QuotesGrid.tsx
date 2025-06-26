import React, { useState } from 'react';
import { FileText, Plus, Clock, ArrowRight, X, Upload, CheckCircle2, XCircle } from 'lucide-react';
import { Quote, QuoteStatus } from '../../types/project';
import { EmptyQuoteState } from './EmptyQuoteState';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { QuoteCard } from './QuoteCard';
import { TrashView } from './TrashView';
import { DeleteButton } from '../common/DeleteButton';
import { formatNumber } from '../../utils/formatNumber';
import { calculateTotalCosts } from '../../utils/budgetCalculations/totals';
import { QuoteStorage } from '../../utils/quoteStorage';
import { SyncManager } from '../../utils/syncManager';
import { CurrencyDisplay } from '../budget/CurrencyDisplay';
import { useCurrencyStore } from '../../stores/currencyStore';

interface QuotesGridProps {
  quotes: Quote[];
  selectedQuote: Quote | null;
  showTrash?: boolean;
  budgets: Record<string, { budget: any[]; workBudget: any[] }>;
  settings: any;
  onSelectQuote: (quote: Quote) => void;
  onCreateQuote: () => void;
  onDeleteQuote?: (quoteId: string) => void;
  onRestoreQuote?: (quoteId: string) => void;
  onUpdateQuoteStatus?: (quoteId: string, status: QuoteStatus, details?: { rejectionReason?: string }) => void;
}

function useOfflineQuotes(quotes: Quote[]) {
  const [displayedQuotes, setDisplayedQuotes] = React.useState<Quote[]>([]);

  React.useEffect(() => {
    const syncStatus = SyncManager.getInstance().getStatus();
    
    const storedQuotes = QuoteStorage.getAllQuotes();
    const mergedQuotes = quotes.filter(quote => {
      // Keep quote if it exists in online data
      if (navigator.onLine) return true;
      
      // For offline mode, only keep quotes that exist in storage
      const storedQuote = storedQuotes[quote.id];
      return storedQuote !== undefined && !storedQuote.quote.is_deleted;
    });

    setDisplayedQuotes(mergedQuotes);
  }, [quotes, navigator.onLine]);

  return displayedQuotes;
}

export function QuotesGrid({
  quotes,
  selectedQuote,
  showTrash = false,
  budgets,
  settings,
  onSelectQuote,
  onCreateQuote,
  onDeleteQuote,
  onRestoreQuote,
  onUpdateQuoteStatus
}: QuotesGridProps) {
  const displayedQuotes = useOfflineQuotes(quotes);
  const { convertAmount } = useCurrencyStore();
  const [recentlyUpdatedQuotes, setRecentlyUpdatedQuotes] = useState<string[]>([]);
  
  // Filter quotes based on deleted status and trash view
  const filteredQuotes = showTrash 
    ? displayedQuotes.filter(q => q.is_deleted)
    : displayedQuotes.filter(q => !q.is_deleted);

  // Separate main and additive quotes
  const activeQuotes = filteredQuotes;
  const mainQuotes = activeQuotes.filter(q => q.type === 'main');
  const additiveQuotes = activeQuotes.filter(q => q.type === 'additive');

  // Tri des devis par date de mise à jour décroissante (du plus récent au plus ancien)
  const sortedMainQuotes = mainQuotes.sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Calculer le total HT d'un budget
  const getQuoteTotal = (quote: Quote) => {
    const budget = budgets[quote.id]?.budget || [];
    const { grandTotal = 0 } = calculateTotalCosts(budget, settings);
    return convertAmount(grandTotal);
  };

  // Group quotes by status
  const draftQuotes = activeQuotes.filter(q => q.status === 'draft');
  const validatedQuotes = activeQuotes.filter(q => q.status === 'validated');
  const rejectedQuotes = activeQuotes.filter(q => q.status === 'rejected');

  // Calculate totals by status
  const draftTotal = draftQuotes.reduce((sum, quote) => sum + getQuoteTotal(quote), 0);
  const validatedTotal = validatedQuotes.reduce((sum, quote) => sum + getQuoteTotal(quote), 0);
  const rejectedTotal = rejectedQuotes.reduce((sum, quote) => sum + getQuoteTotal(quote), 0);

  // Handle status update with animation
  const handleStatusUpdate = (quoteId: string, status: QuoteStatus, details?: { rejectionReason?: string }) => {
    if (onUpdateQuoteStatus) {
      onUpdateQuoteStatus(quoteId, status, details);
      
      // Add this quote to recently updated list
      setRecentlyUpdatedQuotes(prev => [...prev, quoteId]);
      
      // Remove from list after animation completes
      setTimeout(() => {
        setRecentlyUpdatedQuotes(prev => prev.filter(id => id !== quoteId));
      }, 3000);
    }
  };

  if (showTrash) {
    return (
      <TrashView
        quotes={filteredQuotes}
        budgets={budgets}
        settings={settings}
        onRestoreQuote={onRestoreQuote}
      />
    );
  }

  if (activeQuotes.length === 0 && !showTrash) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Budgets</h2>
          <button
            onClick={onCreateQuote}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            <Plus size={16} />
            Nouveau budget
          </button>
        </div>

        <EmptyQuoteState onCreateQuote={onCreateQuote} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Budgets</h2>
        <button
          onClick={onCreateQuote}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Nouveau budget
        </button>
      </div>

      {/* Résumé des statuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <CheckCircle2 size={16} className="text-green-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-700">Validés</h3>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(validatedTotal)} <CurrencyDisplay />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {validatedQuotes.length} budget{validatedQuotes.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <Clock size={16} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-700">En cours</h3>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(draftTotal)} <CurrencyDisplay />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {draftQuotes.length} budget{draftQuotes.length > 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
              <XCircle size={16} className="text-red-600" />
            </div>
            <h3 className="text-sm font-medium text-gray-700">Annulés</h3>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {formatNumber(rejectedTotal)} <CurrencyDisplay />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {rejectedQuotes.length} budget{rejectedQuotes.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedMainQuotes.map(quote => (
          <div key={quote.id} className="space-y-2">
            <QuoteCard
              quote={quote}
              budget={budgets[quote.id]?.budget}
              totalAmount={getQuoteTotal(quote)}
              isSelected={selectedQuote?.id === quote.id}
              onClick={() => onSelectQuote(quote)}
              onDelete={onDeleteQuote ? () => onDeleteQuote(quote.id) : undefined}
              onUpdateStatus={onUpdateQuoteStatus ? 
                (status, details) => handleStatusUpdate(quote.id, status, details) : 
                undefined
              }
            />

            {additiveQuotes
              .filter(aq => aq.parentQuoteId === quote.id)
              // Tri des additifs par date de mise à jour décroissante
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map(additiveQuote => (
                <QuoteCard
                  key={additiveQuote.id}
                  quote={additiveQuote}
                  budget={budgets[additiveQuote.id]?.budget}
                  totalAmount={getQuoteTotal(additiveQuote)}
                  isSelected={selectedQuote?.id === additiveQuote.id}
                  isAdditive={true}
                  onClick={() => onSelectQuote(additiveQuote)}
                  onDelete={onDeleteQuote ? () => onDeleteQuote(additiveQuote.id) : undefined}
                  onUpdateStatus={onUpdateQuoteStatus ? 
                    (status, details) => handleStatusUpdate(additiveQuote.id, status, details) : 
                    undefined
                  }
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}