import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { formatNumber } from '../../../utils/formatNumber';
import { BudgetCategory, BudgetLine } from '../../../types/budget';

interface BudgetCategoryRowProps {
  category: BudgetCategory;
  categoryNumber: string;
  settings: any;
  isWorkBudgetActive: boolean;
  isForceEditing: boolean;
  onUpdateCategory: (categoryId: string, updates: Partial<BudgetCategory>) => void;
  total: number;
  children?: React.ReactNode;
  expenseCategories: any[];
  showExpenseDistribution: boolean;
  expenseCategoryTotals: number[];
}

export const BudgetCategoryRow: React.FC<BudgetCategoryRowProps> = ({
  category,
  categoryNumber,
  settings,
  isWorkBudgetActive,
  isForceEditing,
  onUpdateCategory,
  total,
  children,
  expenseCategories,
  showExpenseDistribution,
  expenseCategoryTotals
}) => (
  <tr className="group bg-blue-800 h-8 border-b border-blue-700 w-full">
    <td className="w-6 px-1 bg-blue-800">
      <button 
        onClick={() => onUpdateCategory(category.id, { isExpanded: !category.isExpanded })}
        className="p-0.5 hover:bg-blue-700 rounded transition-colors"
      >
        {category.isExpanded ? (
          <ChevronDown size={14} className="text-white" />
        ) : (
          <ChevronRight size={14} className="text-white" />
        )}
      </button>
    </td>
    <td className="px-2 py-1 bg-blue-800">
      <div className="flex items-center">
        <span className="text-[10px] text-gray-300 font-mono tracking-tighter mr-1.5">
          {categoryNumber}
        </span>
        <input
          type="text"
          value={category.name}
          onChange={(e) => onUpdateCategory(category.id, { name: e.target.value })}
          className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-white/30 rounded px-0.5 text-xs font-bold uppercase tracking-wide text-white"
          disabled={isWorkBudgetActive && !isForceEditing}
        />
      </div>
    </td>
    <td colSpan={4} className="bg-blue-800"></td>
    <td className="text-right px-2 py-1 bg-blue-800">
      <span className="text-xs font-bold uppercase tracking-wide text-white">
        {formatNumber(total)}
      </span>
    </td>
    <td colSpan={5} className="bg-blue-800"></td>
    <td className="bg-blue-800"></td>
    {/* Colonnes de répartition pour les catégories */}
    {showExpenseDistribution && expenseCategories.map((expenseCategory, idx) => (
      <td 
        key={expenseCategory.id} 
        className="text-right px-2 py-1 bg-blue-800"
        style={{ borderLeft: `2px solid ${expenseCategory.color}` }}
      >
        {expenseCategoryTotals[idx] > 0 && (
          <span className="text-xs font-bold uppercase tracking-wide text-white">
            {formatNumber(expenseCategoryTotals[idx])}
          </span>
        )}
      </td>
    ))}
  </tr>
); 