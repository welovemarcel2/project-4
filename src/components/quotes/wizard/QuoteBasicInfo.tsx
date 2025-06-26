import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

interface QuoteBasicInfoProps {
  initialData: {
    name: string;
    type: 'main' | 'additive';
    parentQuoteId?: string;
  };
  existingQuotes: {
    id: string;
    name: string;
  }[];
  onSubmit: (data: { 
    name: string; 
    type: 'main' | 'additive';
    parentQuoteId?: string;
  }) => void;
  onCancel: () => void;
}

export function QuoteBasicInfo({ initialData, existingQuotes, onSubmit, onCancel }: QuoteBasicInfoProps) {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    type: initialData.type || 'main',
    parentQuoteId: initialData.parentQuoteId || ''
  });

  // Vérifier s'il existe déjà des budgets principaux
  const mainQuotes = existingQuotes.filter(quote => quote.id !== initialData.parentQuoteId);
  const canCreateAdditive = mainQuotes.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;
    
    if (formData.type === 'additive' && !formData.parentQuoteId) return;

    onSubmit({
      name: formData.name.trim(),
      type: formData.type,
      ...(formData.type === 'additive' && { parentQuoteId: formData.parentQuoteId })
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type de budget
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'main' }))}
            className={`px-4 py-2 text-sm font-medium rounded-md border ${
              formData.type === 'main'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Budget principal
          </button>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, type: 'additive' }))}
            disabled={!canCreateAdditive}
            className={`px-4 py-2 text-sm font-medium rounded-md border ${
              formData.type === 'additive'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : canCreateAdditive
                ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
            }`}
          >
            Budget additif
          </button>
        </div>
      </div>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nom du budget
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Version 1"
          required
        />
      </div>
      
      {formData.type === 'additive' && (
        <div>
          <label htmlFor="parentQuote" className="block text-sm font-medium text-gray-700 mb-1">
            Rattacher au budget
          </label>
          <select
            id="parentQuote"
            value={formData.parentQuoteId}
            onChange={(e) => setFormData(prev => ({ ...prev, parentQuoteId: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Sélectionner un budget principal</option>
            {mainQuotes.map(quote => (
              <option key={quote.id} value={quote.id}>
                {quote.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          disabled={!formData.name.trim() || (formData.type === 'additive' && !formData.parentQuoteId)}
        >
          Suivant
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}