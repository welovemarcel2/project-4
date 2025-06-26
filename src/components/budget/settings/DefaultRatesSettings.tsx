import React from 'react';
import { QuoteSettings } from '../../../types/quoteSettings';

interface DefaultRatesSettingsProps {
  agencyPercent: number;
  marginPercent: number;
  rateLabels?: { rate1Label: string; rate2Label: string };
  onChange: (updates: { 
    defaultAgencyPercent?: number; 
    defaultMarginPercent?: number;
    rateLabels?: { rate1Label: string; rate2Label: string };
  }) => void;
  onApplyToAll: () => void;
}

export function DefaultRatesSettings({ 
  agencyPercent, 
  marginPercent, 
  rateLabels = { rate1Label: 'TX 1', rate2Label: 'TX 2' },
  onChange,
  onApplyToAll
}: DefaultRatesSettingsProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-gray-900">Taux par défaut</h4>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 w-32">Nom du Taux 1</label>
          <input
            type="text"
            value={rateLabels.rate1Label}
            onChange={(e) => onChange({ 
              rateLabels: { 
                ...rateLabels, 
                rate1Label: e.target.value 
              } 
            })}
            className="flex-1 px-2 py-1 text-sm border rounded"
            placeholder="TX 1"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 w-32">{rateLabels.rate1Label}</label>
          <input
            type="number"
            value={agencyPercent}
            onChange={(e) => onChange({ defaultAgencyPercent: parseFloat(e.target.value) })}
            min="0"
            max="100"
            step="0.1"
            className="w-20 px-2 py-1 text-sm border rounded"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 w-32">Nom du Taux 2</label>
          <input
            type="text"
            value={rateLabels.rate2Label}
            onChange={(e) => onChange({ 
              rateLabels: { 
                ...rateLabels, 
                rate2Label: e.target.value 
              } 
            })}
            className="flex-1 px-2 py-1 text-sm border rounded"
            placeholder="TX 2"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 w-32">{rateLabels.rate2Label}</label>
          <input
            type="number"
            value={marginPercent}
            onChange={(e) => onChange({ defaultMarginPercent: parseFloat(e.target.value) })}
            min="0"
            max="100"
            step="0.1"
            className="w-20 px-2 py-1 text-sm border rounded"
          />
          <span className="text-sm text-gray-500">%</span>
        </div>

        <button
          onClick={onApplyToAll}
          className="mt-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
        >
          Appliquer à toutes les lignes
        </button>
      </div>
    </div>
  );
}