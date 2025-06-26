import React from 'react';
import { Quote } from '../../types/project';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { RotateCcw, Trash2, Clock } from 'lucide-react';
import { formatNumber } from '../../utils/formatNumber';
import { calculateTotalCosts } from '../../utils/budgetCalculations/totals';
import { CurrencyDisplay } from '../budget/CurrencyDisplay';

interface TrashViewProps {
  quotes: Quote[];
  budgets: Record<string, { budget: any[]; workBudget: any[] }>;
  settings: any;
  onRestoreQuote?: (quoteId: string) => void;
}

export function TrashView({
  quotes,
  budgets,
  settings,
  onRestoreQuote
}: TrashViewProps) {
  // Filter deleted quotes
  const deletedQuotes = quotes.filter(q => q.is_deleted);

  // Calculate total for a quote
  const getQuoteTotal = (quote: Quote) => {
    const budget = budgets[quote.id]?.budget || [];
    const { grandTotal = 0 } = calculateTotalCosts(budget, settings);
    return grandTotal;
  };

  if (deletedQuotes.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <Trash2 size={48} className="mx-auto text-gray-400 mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">
          La corbeille est vide
        </h3>
        <p className="text-sm text-gray-500">
          Les budgets supprimés apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Corbeille</h2>
      </div>

      <div className="grid gap-4">
        {deletedQuotes.map(quote => (
          <div key={quote.id} className="bg-white rounded-lg shadow hover:shadow-md transition-all">
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">{quote.name}</h3>
                    <div className="flex items-center gap-2">
                      <QuoteStatusBadge status={quote.status} />
                    </div>
                  </div>

                  <div className="text-2xl font-bold text-gray-900 mb-3">
                    {formatNumber(getQuoteTotal(quote))} <CurrencyDisplay /> <span className="text-sm font-normal text-gray-500">HT</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>Version {quote.version}</span>
                    </div>
                    <span>•</span>
                    <span>Modifié le {new Date(quote.updatedAt).toLocaleDateString()}</span>
                  </div>

                  {quote.status === 'rejected' && quote.rejectionReason && (
                    <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">
                      <strong>Motif du refus :</strong> {quote.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {onRestoreQuote && (
              <button
                onClick={() => onRestoreQuote(quote.id)}
                className="w-full px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 border-t border-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Restaurer le budget
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}