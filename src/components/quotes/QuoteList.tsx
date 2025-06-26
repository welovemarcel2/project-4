import React from 'react';
import { Quote, QuoteStatus } from '../../types/project';
import { EmptyQuoteState } from './EmptyQuoteState';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { QuoteStatusActions } from './QuoteStatusActions';
import { DeleteButton } from '../common/DeleteButton';
import { QuoteStorage } from '../../utils/quoteStorage';
import { SyncManager } from '../../utils/syncManager';

function useOfflineQuotes(quotes: Quote[]) {
  const [displayedQuotes, setDisplayedQuotes] = React.useState<Quote[]>(quotes);

  React.useEffect(() => {
    const syncStatus = SyncManager.getInstance().getStatus();
    
    // Always merge online and offline quotes
    const storedQuotes = QuoteStorage.getAllQuotes();
    const offlineQuotes = Object.values(storedQuotes).map(data => ({
      ...data.quote,
      isOffline: !syncStatus.isOnline
    }));
    
    // Merge quotes, preferring online versions when available
    const mergedQuotes = [...quotes];
    offlineQuotes.forEach(offlineQuote => {
      const existingIndex = mergedQuotes.findIndex(q => q.id === offlineQuote.id);
      if (existingIndex === -1) {
        mergedQuotes.push(offlineQuote);
      }
    });

    setDisplayedQuotes(mergedQuotes);
  }, [quotes, navigator.onLine]);

  return displayedQuotes;
}

interface QuoteListProps {
  quotes: Quote[];
  selectedQuote: Quote | null;
  onSelectQuote: (quote: Quote) => void;
  onCreateQuote: () => void;
  onDeleteQuote?: (quoteId: string) => void;
  onUpdateQuoteStatus?: (quoteId: string, status: QuoteStatus, details?: { rejectionReason?: string }) => void;
  compact?: boolean;
}

export function QuoteList({ 
  quotes, 
  selectedQuote,
  onSelectQuote, 
  onCreateQuote,
  onDeleteQuote,
  onUpdateQuoteStatus,
  compact = false 
}: QuoteListProps) {
  const displayedQuotes = useOfflineQuotes(quotes);
  const [recentlyUpdatedQuote, setRecentlyUpdatedQuote] = React.useState<string | null>(null);

  // Organiser les budgets par type
  const mainQuotes = displayedQuotes.filter(q => q.type === 'main');
  const additiveQuotes = displayedQuotes.filter(q => q.type === 'additive');

  // Handle status update with animation
  const handleStatusUpdate = (quoteId: string, status: QuoteStatus, details?: { rejectionReason?: string }) => {
    if (onUpdateQuoteStatus) {
      onUpdateQuoteStatus(quoteId, status, details);
      
      // Set this quote as recently updated to show animation
      setRecentlyUpdatedQuote(quoteId);
      
      // Clear the animation after 3 seconds
      setTimeout(() => {
        setRecentlyUpdatedQuote(null);
      }, 3000);
    }
  };

  if (displayedQuotes.length === 0) {
    return <EmptyQuoteState onCreateQuote={onCreateQuote} compact={compact} />;
  }

  if (compact) {
    return (
      <select 
        value={selectedQuote?.id || ''}
        onChange={(e) => {
          const quote = quotes.find(q => q.id === e.target.value);
          if (quote) onSelectQuote(quote);
        }}
        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm min-w-[200px]"
      >
        {mainQuotes.map(quote => (
          <React.Fragment key={quote.id}>
            <option value={quote.id}>
              {quote.name}
            </option>
            {additiveQuotes
              .filter(aq => aq.parentQuoteId === quote.id)
              .map(additiveQuote => (
                <option key={additiveQuote.id} value={additiveQuote.id}>
                  ↳ {additiveQuote.name}
                </option>
              ))}
          </React.Fragment>
        ))}
      </select>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Budgets</h2>
        <button
          onClick={onCreateQuote}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          <Plus size={16} />
          Nouveau budget
        </button>
      </div>
      <div className="space-y-4">
        {mainQuotes.map(quote => (
          <div key={quote.id} className="space-y-2">
            <div
              onClick={() => onSelectQuote(quote)}
              className={`p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow ${
                selectedQuote?.id === quote.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <h3 className="font-medium">{quote.name}</h3>
                  <QuoteStatusBadge 
                    status={quote.status} 
                    isOffline={quote.isOffline} 
                    showAnimation={recentlyUpdatedQuote === quote.id}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">v{quote.version}</span>
                  {onDeleteQuote && (
                    <DeleteButton
                      onDelete={() => onDeleteQuote(quote.id)}
                      itemType="budget"
                      compact
                    />
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  Modifié le {new Date(quote.updatedAt).toLocaleDateString()}
                </p>
                {onUpdateQuoteStatus && (
                  <QuoteStatusActions
                    quote={quote}
                    onUpdateStatus={(status, details) => handleStatusUpdate(quote.id, status, details)}
                  />
                )}
              </div>

              {quote.status === 'rejected' && quote.rejectionReason && (
                <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                  <strong>Motif du refus :</strong> {quote.rejectionReason}
                </div>
              )}
            </div>

            {/* Afficher les budgets additifs liés */}
            {additiveQuotes
              .filter(aq => aq.parentQuoteId === quote.id)
              .map(additiveQuote => (
                <div
                  key={additiveQuote.id}
                  onClick={() => onSelectQuote(additiveQuote)}
                  className={`ml-6 p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer transition-shadow border-l-2 border-blue-200 ${
                    selectedQuote?.id === additiveQuote.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">↳</span>
                        <h3 className="font-medium">{additiveQuote.name}</h3>
                      </div>
                      <QuoteStatusBadge 
                        status={additiveQuote.status} 
                        showAnimation={recentlyUpdatedQuote === additiveQuote.id}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        Additif v{additiveQuote.version}
                      </span>
                      {onDeleteQuote && (
                        <DeleteButton
                          onDelete={() => onDeleteQuote(additiveQuote.id)}
                          itemType="budget"
                          compact
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      Modifié le {new Date(additiveQuote.updatedAt).toLocaleDateString()}
                    </p>
                    {onUpdateQuoteStatus && (
                      <QuoteStatusActions
                        quote={additiveQuote}
                        onUpdateStatus={(status, details) => handleStatusUpdate(additiveQuote.id, status, details)}
                      />
                    )}
                  </div>

                  {additiveQuote.status === 'rejected' && additiveQuote.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                      <strong>Motif du refus :</strong> {additiveQuote.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Import Plus icon from lucide-react
function Plus(props: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size}
      height={props.size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}