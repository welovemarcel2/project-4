import React, { useState } from 'react';
import { ArrowLeft, Save, ListTree, List } from 'lucide-react';
import { QuoteSettings } from '../../../types/quoteSettings';

interface QuoteDisplaySettingsProps {
  initialSettings: Partial<QuoteSettings>;
  onSubmit: (settings: Partial<QuoteSettings>) => void;
  onBack: () => void;
}

export function QuoteDisplaySettings({ initialSettings, onSubmit, onBack }: QuoteDisplaySettingsProps) {
  const [settings, setSettings] = useState({
    socialChargesDisplay: initialSettings.socialChargesDisplay || 'detailed',
    applySocialChargesMargins: initialSettings.applySocialChargesMargins !== undefined ? initialSettings.applySocialChargesMargins : false
  });

  console.log("Initial settings:", initialSettings);
  console.log("Current settings state:", settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting settings:", settings);
    onSubmit(settings);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Charges Sociales</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, socialChargesDisplay: 'detailed' }))}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                  settings.socialChargesDisplay === 'detailed'
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <ListTree size={16} className={settings.socialChargesDisplay === 'detailed' ? 'text-blue-500' : 'text-gray-400'} />
                <div className="text-left">
                  <div className="font-medium">Par sous-catégorie</div>
                  <div className="text-xs text-gray-500">
                    Les charges sociales sont affichées sous chaque section
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, socialChargesDisplay: 'grouped' }))}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                  settings.socialChargesDisplay === 'grouped'
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <List size={16} className={settings.socialChargesDisplay === 'grouped' ? 'text-blue-500' : 'text-gray-400'} />
                <div className="text-left">
                  <div className="font-medium">Groupées en fin de devis</div>
                  <div className="text-xs text-gray-500">
                    Les charges sociales sont regroupées dans une catégorie dédiée en fin de devis
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.applySocialChargesMargins}
                onChange={(e) => setSettings(prev => ({ ...prev, applySocialChargesMargins: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-600">
                Appliquer les marges sur les charges sociales
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <ArrowLeft size={16} />
          Retour
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          <Save size={16} />
          Créer le budget
        </button>
      </div>
    </form>
  );
}