import React from 'react';
import { FileText, Plus } from 'lucide-react';

interface EmptyQuoteStateProps {
  onCreateQuote: () => void;
  compact?: boolean;
}

export function EmptyQuoteState({ onCreateQuote, compact = false }: EmptyQuoteStateProps) {
  if (compact) {
    return (
      <button
        onClick={onCreateQuote}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
      >
        <Plus size={16} />
        Créer un budget
      </button>
    );
  }

  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
      <FileText size={48} className="mx-auto text-gray-400 mb-3" />
      <h3 className="text-base font-medium text-gray-900 mb-1">
        Aucun budget
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Commencez par créer votre premier budget
      </p>
      <button
        onClick={onCreateQuote}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md"
      >
        <Plus size={16} />
        Créer mon premier budget
      </button>
    </div>
  );
}