import React from 'react';
import { X } from 'lucide-react';
import { QuoteSettings } from '../../../types/quoteSettings';

interface EmptyLinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: QuoteSettings;
  onUpdateSettings: (settings: Partial<QuoteSettings>) => void;
}

export function EmptyLinesModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}: EmptyLinesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Options d'affichage</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.showEmptyItems}
              onChange={(e) => onUpdateSettings({ showEmptyItems: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">
              Afficher les lignes vides
            </span>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.showTotalCostColumn}
              onChange={(e) => onUpdateSettings({ showTotalCostColumn: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">
              Afficher la colonne "Coût TT"
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}