import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SocialChargeRate } from '../../../types/quoteSettings';

interface SocialChargesSettingsProps {
  rates: SocialChargeRate[];
  onChange: (rates: SocialChargeRate[]) => void;
}

export function SocialChargesSettings({ rates, onChange }: SocialChargesSettingsProps) {
  const handleAdd = () => {
    onChange([...rates, { id: Date.now().toString(), label: '', rate: 0 }]);
  };

  const handleUpdate = (index: number, updates: Partial<SocialChargeRate>) => {
    onChange(rates.map((rate, i) => 
      i === index ? { ...rate, ...updates } : rate
    ));
  };

  const handleDelete = (index: number) => {
    onChange(rates.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-gray-900">Charges sociales</h4>
      
      <div className="space-y-2">
        {rates.map((rate, index) => (
          <div key={rate.id} className="flex items-center gap-2">
            <input
              type="text"
              value={rate.label}
              onChange={(e) => handleUpdate(index, { label: e.target.value })}
              placeholder="Libellé"
              className="flex-1 px-2 py-1 text-sm border rounded"
            />
            <input
              type="number"
              value={rate.rate * 100}
              onChange={(e) => handleUpdate(index, { rate: parseFloat(e.target.value) / 100 })}
              min="0"
              max="100"
              step="0.1"
              className="w-20 px-2 py-1 text-sm border rounded"
            />
            <span className="text-sm text-gray-500">%</span>
            <button
              onClick={() => handleDelete(index)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
      >
        <Plus size={14} />
        Ajouter un taux
      </button>
    </div>
  );
}