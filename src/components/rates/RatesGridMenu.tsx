import React from 'react';
import { X, Table2 } from 'lucide-react';
import { BudgetCategory, BudgetLine } from '../../types/budget';
import { formatNumber } from '../../utils/formatNumber';

interface RatesGridMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentBudget: BudgetCategory[];
  onUpdateBudget: (budget: BudgetCategory[]) => void;
}

interface RateItem {
  id: string;
  name: string;
  path: string[];
  rate: number;
  categoryId: string;
}

export function RatesGridMenu({
  isOpen,
  onClose,
  currentBudget,
  onUpdateBudget
}: RatesGridMenuProps) {
  if (!isOpen) return null;

  // Extraire tous les tarifs du budget
  const extractRates = (categories: BudgetCategory[]): RateItem[] => {
    const rates: RateItem[] = [];

    categories.forEach(category => {
      const extractFromItems = (items: BudgetLine[], itemPath: string[]) => {
        items.forEach(item => {
          if (item.type === 'post' || item.type === 'subPost') {
            rates.push({
              id: item.id,
              name: item.name,
              path: [...itemPath, item.name],
              rate: item.rate,
              categoryId: category.id
            });
          }
          if (item.subItems) {
            extractFromItems(item.subItems, [...itemPath, item.name]);
          }
        });
      };

      extractFromItems(category.items, [category.name]);
    });

    return rates;
  };

  // Mettre à jour un tarif dans le budget
  const updateRate = (rateId: string, categoryId: string, newRate: number) => {
    const updateItems = (items: BudgetLine[]): BudgetLine[] => {
      return items.map(item => {
        if (item.id === rateId) {
          return { ...item, rate: newRate };
        }
        if (item.subItems) {
          return { ...item, subItems: updateItems(item.subItems) };
        }
        return item;
      });
    };

    const newBudget = currentBudget.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          items: updateItems(category.items)
        };
      }
      return category;
    });

    onUpdateBudget(newBudget);
  };

  const rates = extractRates(currentBudget);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Table2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Grille tarifaire</h3>
              <p className="text-sm text-gray-500">
                Gérez les tarifs de tous les postes du budget
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
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
                {rates.map(rate => (
                  <tr key={rate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{rate.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {rate.path.join(' > ')}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          value={rate.rate || ''}
                          onChange={(e) => updateRate(
                            rate.id,
                            rate.categoryId,
                            parseFloat(e.target.value) || 0
                          )}
                          className="w-24 px-2 py-1 text-right text-sm border rounded"
                          min="0"
                          step="0.01"
                        />
                        <span className="text-sm text-gray-500">€</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}