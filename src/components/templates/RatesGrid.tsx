import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useTemplatesStore } from '../../stores/templatesStore';
import { formatNumber } from '../../utils/formatNumber';

interface RatesGridProps {
  templateId: string;
}

export function RatesGrid({ templateId }: RatesGridProps) {
  const [search, setSearch] = useState('');
  const { getTemplate, updateTemplateRate } = useTemplatesStore();
  const template = getTemplate(templateId);

  if (!template) return null;

  const filteredRates = template.rates.filter(rate =>
    rate.name.toLowerCase().includes(search.toLowerCase()) ||
    rate.path.some(p => p.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un poste..."
            className="w-full pl-10 pr-4 py-2 text-sm border rounded-md"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Poste</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Chemin</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tarif</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredRates.map(rate => (
              <tr key={rate.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm">{rate.name}</td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {rate.path.join(' > ')}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={rate.rate}
                    onChange={(e) => updateTemplateRate(
                      templateId,
                      rate.id,
                      parseFloat(e.target.value) || 0
                    )}
                    className="w-24 px-2 py-1 text-right text-sm border rounded"
                    min="0"
                    step="0.01"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}