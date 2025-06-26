import React from 'react';
import { BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { DeleteButton } from './DeleteButton';
import { formatNumber } from '../../utils/formatNumber';
import { calculateCategoryTotal } from '../../utils/budgetCalculations/base';

interface CategoryRowProps {
  category: BudgetCategory;
  index: number;
  settings: QuoteSettings;
  onUpdateCategory: (updates: Partial<BudgetCategory>) => void;
  onDeleteItem: () => void;
  disabled?: boolean;
}

export function CategoryRow({ 
  category, 
  index, 
  settings,
  onUpdateCategory,
  onDeleteItem,
  disabled = false
}: CategoryRowProps) {
  const total = calculateCategoryTotal(category.items, settings);

  return (
    <tr className="group bg-blue-100/50 h-8 border-b border-blue-200/50">
      <td className="px-1 py-1">
        <div className="flex items-center gap-1">
          {/* Ne pas permettre la suppression de la catégorie des charges sociales */}
          {category.id !== 'social-charges' && (
            <DeleteButton
              onClick={onDeleteItem}
              type="category"
              disabled={disabled}
            />
          )}
        </div>
      </td>
      <td className="px-2 py-1" colSpan={5}>
        <div className="flex items-center">
          <span className="text-[11px] text-gray-600 font-mono mr-2">{index + 1}</span>
          <input
            type="text"
            value={category.name}
            onChange={(e) => onUpdateCategory({ name: e.target.value })}
            className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-0.5 text-xs font-bold uppercase tracking-wide text-blue-900"
            disabled={disabled}
          />
        </div>
      </td>
      <td className="text-right px-2 py-1">
        <span className="text-xs font-bold uppercase tracking-wide text-blue-900">
          {formatNumber(total)}
        </span>
      </td>
      <td colSpan={4}></td>
    </tr>
  );
}