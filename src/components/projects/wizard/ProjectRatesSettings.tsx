import React, { useState } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface ProjectRatesSettingsProps {
  initialData: {
    defaultAgencyPercent: number;
    defaultMarginPercent: number;
    rate1Label: string;
    rate2Label: string;
    socialChargeRates: any[];
  };
  onSubmit: (data: { 
    defaultAgencyPercent: number; 
    defaultMarginPercent: number;
    rate1Label: string;
    rate2Label: string;
    socialChargeRates: any[];
  }) => void;
  onBack: () => void;
}

export function ProjectRatesSettings({ initialData, onSubmit, onBack }: ProjectRatesSettingsProps) {
  const [formData, setFormData] = useState({
    defaultAgencyPercent: initialData.defaultAgencyPercent,
    defaultMarginPercent: initialData.defaultMarginPercent,
    rate1Label: initialData.rate1Label,
    rate2Label: initialData.rate2Label,
    socialChargeRates: initialData.socialChargeRates
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Taux par défaut</h3>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Nom du Taux 1</label>
            <input
              type="text"
              value={formData.rate1Label}
              onChange={(e) => setFormData(prev => ({ ...prev, rate1Label: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="TX 1"
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Valeur du Taux 1 (%)</label>
            <input
              type="number"
              value={formData.defaultAgencyPercent}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                defaultAgencyPercent: parseFloat(e.target.value) || 0 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10"
              min="0"
              max="100"
              step="0.1"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Nom du Taux 2</label>
            <input
              type="text"
              value={formData.rate2Label}
              onChange={(e) => setFormData(prev => ({ ...prev, rate2Label: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="TX 2"
            />
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-600 mb-1">Valeur du Taux 2 (%)</label>
            <input
              type="number"
              value={formData.defaultMarginPercent}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                defaultMarginPercent: parseFloat(e.target.value) || 0 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="15"
              min="0"
              max="100"
              step="0.1"
            />
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
          Suivant
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  );
}