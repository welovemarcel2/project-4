import React from 'react';
import { QuoteSettings } from '../../../types/quoteSettings';

interface SocialChargesDisplaySettingsProps {
  socialChargesDisplay: QuoteSettings['socialChargesDisplay'];
  onChange: (display: QuoteSettings['socialChargesDisplay']) => void;
}

export function SocialChargesDisplaySettings({
  socialChargesDisplay,
  onChange
}: SocialChargesDisplaySettingsProps) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-gray-900">Affichage des charges sociales</h4>
      
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={socialChargesDisplay === 'detailed'}
            onChange={() => onChange('detailed')}
            className="w-4 h-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="text-sm">
            <div className="text-gray-700">Affichage par sous-catégorie</div>
            <div className="text-xs text-gray-500">
              Les charges sociales sont affichées sous chaque sous-catégorie
            </div>
          </div>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={socialChargesDisplay === 'grouped'}
            onChange={() => onChange('grouped')}
            className="w-4 h-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="text-sm">
            <div className="text-gray-700">Affichage groupé</div>
            <div className="text-xs text-gray-500">
              Les charges sociales sont regroupées dans une catégorie dédiée en fin de devis
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}