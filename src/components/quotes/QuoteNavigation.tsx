import React, { useState } from 'react';
import { Quote, QuoteStatus } from '../../types/project';
import { ChevronRight, ArrowLeft, Link } from 'lucide-react';
import { QuoteStatusActions } from './QuoteStatusActions';
import { QuoteLinkModal } from './QuoteLinkModal';

interface QuoteNavigationProps {
  mainQuote: Quote;
  additiveQuotes: Quote[];
  selectedQuote: Quote;
  allMainQuotes: Quote[];
  onSelectQuote: (quote: Quote) => void;
  onUpdateStatus: (quoteId: string, status: QuoteStatus, details?: { rejectionReason?: string }) => void;
  onUpdateParentQuote: (quoteId: string, newParentId: string) => void;
}

export function QuoteNavigation({
  mainQuote,
  additiveQuotes,
  selectedQuote,
  allMainQuotes,
  onSelectQuote,
  onUpdateStatus,
  onUpdateParentQuote
}: QuoteNavigationProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const isAdditive = selectedQuote.type === 'additive';

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Bouton de retour au budget initial */}
            <button
              onClick={() => onSelectQuote(mainQuote)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                selectedQuote.id === mainQuote.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {isAdditive && <ArrowLeft size={16} />}
              Budget initial
            </button>

            {/* Fil d'Ariane pour les additifs */}
            {additiveQuotes.map((quote, index) => (
              <React.Fragment key={quote.id}>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                <button
                  onClick={() => onSelectQuote(quote)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedQuote.id === quote.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {quote.name}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Actions de validation/refus et gestion des liens */}
          <div className="flex items-center gap-2">
            <QuoteStatusActions
              quote={selectedQuote}
              onUpdateStatus={(status, details) => onUpdateStatus(selectedQuote.id, status, details)}
            />

            {/* Bouton de gestion des liens pour les additifs */}
            {isAdditive && (
              <button
                onClick={() => setShowLinkModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50"
                title="Changer le budget principal"
              >
                <Link size={16} />
                Changer le lien
              </button>
            )}

            {/* Badge indiquant qu'on est dans un additif */}
            {isAdditive && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Additif
              </span>
            )}
          </div>
        </div>

        {/* Barre de statut pour les additifs */}
        {isAdditive && (
          <div className="px-4 py-2 bg-blue-50 text-sm text-blue-700 rounded-b-lg border-t border-blue-100">
            Vous modifiez un budget additif. Les modifications n'affectent pas le budget initial.
          </div>
        )}
      </div>

      {/* Modal pour changer le lien du budget additif */}
      {showLinkModal && (
        <QuoteLinkModal
          quote={selectedQuote}
          mainQuotes={allMainQuotes}
          currentParentId={mainQuote.id}
          onClose={() => setShowLinkModal(false)}
          onUpdateLink={(newParentId) => {
            onUpdateParentQuote(selectedQuote.id, newParentId);
            setShowLinkModal(false);
          }}
        />
      )}
    </>
  );
}