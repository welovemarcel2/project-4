import React, { useState } from 'react';
import { Quote, QuoteStatus } from '../../types/project';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { QuoteStatusActions } from './QuoteStatusActions';
import { DeleteButton } from '../common/DeleteButton';
import { formatNumber } from '../../utils/formatNumber';
import { Clock, ArrowRight } from 'lucide-react';
import { CurrencyDisplay } from '../budget/CurrencyDisplay';

interface QuoteCardProps {
  quote: Quote;
  budget?: any[];
  totalAmount?: number;
  isSelected?: boolean;
  isAdditive?: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onUpdateStatus?: (status: QuoteStatus, details?: { rejectionReason?: string }) => void;
}

export function QuoteCard({
  quote,
  budget,
  totalAmount = 0,
  isSelected = false,
  isAdditive = false,
  onClick,
  onDelete,
  onUpdateStatus
}: QuoteCardProps) {
  const [statusUpdated, setStatusUpdated] = useState(false);

  const handleStatusUpdate = (status: QuoteStatus, details?: { rejectionReason?: string }) => {
    if (onUpdateStatus) {
      onUpdateStatus(status, details);
      setStatusUpdated(true);
      
      // Reset the animation after it completes
      setTimeout(() => {
        setStatusUpdated(false);
      }, 3000);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow hover:shadow-md transition-all ${
        isAdditive ? 'ml-6 border-l-2 border-blue-200' : ''
      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-1">
                {isAdditive && <ArrowRight size={16} className="text-blue-500" />}
                <h3 className="font-medium">{quote.name}</h3>
                <QuoteStatusBadge 
                  status={quote.status} 
                  isOffline={quote.isOffline}
                  showAnimation={statusUpdated}
                />
              </div>
              <div className="flex items-center gap-2">
                {onUpdateStatus && (
                  <QuoteStatusActions
                    quote={quote}
                    onUpdateStatus={handleStatusUpdate}
                    compact={true}
                  />
                )}
                {onDelete && (
                  <DeleteButton
                    onDelete={onDelete}
                    itemType="budget"
                    compact
                  />
                )}
              </div>
            </div>

            <div className="text-2xl font-bold text-gray-900 mb-3">
              {formatNumber(totalAmount)} <CurrencyDisplay /> <span className="text-sm font-normal text-gray-500">HT</span>
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

      <div className="flex items-center justify-center px-4 py-2 border-t border-gray-100">
        <button
          onClick={onClick}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Ouvrir le budget
        </button>
      </div>
    </div>
  );
}