import React, { useState } from 'react';
import { Quote } from '../../types/project';
import { X } from 'lucide-react';

interface QuoteLinkModalProps {
  quote: Quote;
  mainQuotes: Quote[];
  currentParentId: string;
  onClose: () => void;
  onUpdateLink: (newParentId: string) => void;
}

export function QuoteLinkModal({
  quote,
  mainQuotes,
  currentParentId,
  onClose,
  onUpdateLink
}: QuoteLinkModalProps) {
  const [selectedParentId, setSelectedParentId] = useState(currentParentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedParentId !== currentParentId) {
      onUpdateLink(selectedParentId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Changer le budget principal</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Budget additif
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700">
              {quote.name}
            </div>
          </div>

          <div>
            <label htmlFor="parentQuote" className="block text-sm font-medium text-gray-700 mb-2">
              Rattacher au budget principal
            </label>
            <select
              id="parentQuote"
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {mainQuotes.map(mainQuote => (
                <option key={mainQuote.id} value={mainQuote.id}>
                  {mainQuote.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              disabled={selectedParentId === currentParentId}
            >
              Confirmer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}