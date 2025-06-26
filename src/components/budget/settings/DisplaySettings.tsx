import React from 'react';
import { QuoteSettings, NumberingFormat } from '../../../types/quoteSettings';
import { ListTree, List } from 'lucide-react';
import { NumberingSettings } from './NumberingSettings';

interface DisplaySettingsProps {
  showEmptyItems: boolean;
  socialChargesDisplay: 'detailed' | 'grouped';
  applySocialChargesMargins: boolean;
  onChange: (updates: Partial<QuoteSettings>) => void;
}

export function DisplaySettings({
  showEmptyItems,
  socialChargesDisplay,
  applySocialChargesMargins,
  onChange
}: DisplaySettingsProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-gray-900">Affichage</h4>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-gray-700 font-medium">Charges sociales</label>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onChange({ socialChargesDisplay: 'detailed' })}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                socialChargesDisplay === 'detailed'
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <ListTree size={16} className={socialChargesDisplay === 'detailed' ? 'text-blue-500' : 'text-gray-400'} />
              <div className="text-left">
                <div className="font-medium">Par sous-catégorie</div>
                <div className="text-xs text-gray-500">
                  Les charges sociales sont affichées sous chaque section
                </div>
              </div>
            </button>

            <button
              onClick={() => onChange({ socialChargesDisplay: 'grouped' })}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                socialChargesDisplay === 'grouped'
                  ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <List size={16} className={socialChargesDisplay === 'grouped' ? 'text-blue-500' : 'text-gray-400'} />
              <div className="text-left">
                <div className="font-medium">Groupée sous forme de catégorie</div>
                <div className="text-xs text-gray-500">
                  Les charges sociales sont groupée dans une seule catégorie
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showEmptyItems}
              onChange={(e) => onChange({ showEmptyItems: e.target.checked })}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-600">
              Afficher les lignes vides
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}