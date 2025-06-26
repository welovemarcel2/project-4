import React, { useState } from 'react';
import { Quote, QuoteStatus } from '../../types/project';
import { CheckCircle2, XCircle, RotateCcw, AlertTriangle, ChevronDown } from 'lucide-react';

interface QuoteStatusActionsProps {
  quote: Quote;
  onUpdateStatus: (status: QuoteStatus, details?: { rejectionReason?: string }) => void;
  compact?: boolean;
}

export function QuoteStatusActions({ quote, onUpdateStatus, compact = false }: QuoteStatusActionsProps) {
  const [showRejectionReason, setShowRejectionReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleStatusChange = (status: QuoteStatus) => {
    if (status === 'rejected' && !quote.rejectionReason) {
      setShowRejectionReason(true);
      return;
    }
    
    updateStatus(status);
    setShowDropdown(false);
  };

  const updateStatus = (status: QuoteStatus, details?: { rejectionReason?: string }) => {
    setIsUpdating(true);
    
    try {
      onUpdateStatus(status, details);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSubmitRejection = () => {
    updateStatus('rejected', { rejectionReason });
    setShowRejectionReason(false);
    setRejectionReason('');
  };

  // Compact dropdown version for ProjectHeader
  if (compact) {
    const getStatusColor = (status: QuoteStatus) => {
      switch (status) {
        case 'validated': return 'bg-green-50 border-green-200 text-green-700';
        case 'rejected': return 'bg-red-50 border-red-200 text-red-700';
        case 'draft':
        default: return 'bg-amber-50 border-amber-200 text-amber-700';
      }
    };

    const getStatusDot = (status: QuoteStatus) => {
      switch (status) {
        case 'validated': return 'bg-green-500';
        case 'rejected': return 'bg-red-500';
        case 'draft':
        default: return 'bg-amber-500';
      }
    };

    const getStatusText = (status: QuoteStatus) => {
      switch (status) {
        case 'validated': return 'Validé';
        case 'rejected': return 'Refusé';
        case 'draft':
        default: return 'En cours';
      }
    };

    const statusColor = getStatusColor(quote.status);
    const statusDot = getStatusDot(quote.status);
    const statusText = getStatusText(quote.status);

    return (
      <>
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${statusColor}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusDot}`}></span>
            {statusText}
            <ChevronDown size={14} />
          </button>
          
          {showDropdown && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => handleStatusChange('draft')}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
                    quote.status === 'draft' ? 'bg-amber-50 text-amber-700' : ''
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  En cours
                </button>
                <button
                  onClick={() => handleStatusChange('validated')}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
                    quote.status === 'validated' ? 'bg-green-50 text-green-700' : ''
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  Validé
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-50 ${
                    quote.status === 'rejected' ? 'bg-red-50 text-red-700' : ''
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  Refusé
                </button>
              </div>
            </>
          )}
        </div>

        {/* Rejection reason modal */}
        {showRejectionReason && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-amber-500" />
                <h3 className="text-lg font-semibold">Motif du refus</h3>
              </div>
              
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="Veuillez indiquer le motif du refus..."
                rows={4}
              />
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowRejectionReason(false)}
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitRejection}
                  className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md"
                  disabled={!rejectionReason.trim()}
                >
                  Confirmer le refus
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Full version for other components
  if (quote.status !== 'draft') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 text-sm">
          <span className={`inline-flex items-center gap-1 font-medium ${
            quote.status === 'validated' ? 'text-green-600' : 'text-red-600'
          }`}>
            {quote.status === 'validated' ? (
              <>
                <CheckCircle2 size={16} />
                Validé
              </>
            ) : (
              <>
                <XCircle size={16} />
                Refusé
              </>
            )}
          </span>
        </div>

        {quote.status === 'rejected' && (
          <button
            onClick={() => handleStatusChange('draft')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            title="Remettre en brouillon"
            disabled={isUpdating}
          >
            <RotateCcw size={16} />
            Remettre en brouillon
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleStatusChange('validated')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50 rounded-md transition-colors"
          title="Valider le budget"
          disabled={isUpdating}
        >
          <CheckCircle2 size={16} />
          Valider
        </button>

        <button
          onClick={() => handleStatusChange('rejected')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 rounded-md transition-colors"
          title="Refuser le budget"
          disabled={isUpdating}
        >
          <XCircle size={16} />
          Refuser
        </button>
      </div>

      {/* Rejection reason modal */}
      {showRejectionReason && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-amber-500" />
              <h3 className="text-lg font-semibold">Motif du refus</h3>
            </div>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Veuillez indiquer le motif du refus..."
              rows={4}
            />
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectionReason(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitRejection}
                className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md"
                disabled={!rejectionReason.trim()}
              >
                Confirmer le refus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}