import React from 'react';
import { BudgetCategory, BudgetLine } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { formatNumber } from '../../utils/formatNumber';
import { calculateLineTotal } from '../../utils/budgetCalculations/base';

interface WorkSummaryProps {
  budget: BudgetCategory[];
  settings: QuoteSettings;
}

function calculateBudgetTotal(items: BudgetLine[]): number {
  return items.reduce((total, item) => {
    if (item.subItems && item.subItems.length > 0) {
      return total + calculateBudgetTotal(item.subItems);
    }
    return total + calculateLineTotal(item);
  }, 0);
}

export function WorkSummary({ budget, settings }: WorkSummaryProps) {
  // Calculer les totaux pour chaque catégorie
  const categoryTotals = budget.map(category => {
    if (category.id === 'social-charges') return null;

    const budgetTotal = calculateBudgetTotal(category.items);

    return {
      id: category.id,
      name: category.name,
      budgetTotal
    };
  }).filter(Boolean);

  // Calculer les totaux globaux
  const totals = categoryTotals.reduce((acc, cat) => ({
    budget: acc.budget + (cat?.budgetTotal || 0)
  }), { budget: 0 });

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Colonne Budget */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Budget initial</h3>
        <div className="space-y-2">
          {categoryTotals.map((category, index) => {
            if (!category || (category.budgetTotal === 0 && !settings.showEmptyItems)) {
              return null;
            }

            return (
              <div key={category.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 font-mono">{index + 1}</span>
                  <span className="text-gray-600">{category.name}</span>
                </div>
                <span className="font-medium">
                  {category.budgetTotal > 0 ? `${formatNumber(category.budgetTotal)} €` : <span className="text-gray-400">-</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Colonne Travail */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Suivi</h3>
        <div className="space-y-2">
          {categoryTotals.map((category, index) => {
            if (!category || (category.budgetTotal === 0 && !settings.showEmptyItems)) {
              return null;
            }

            return (
              <div key={category.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 font-mono">{index + 1}</span>
                  <span className="text-gray-600">{category.name}</span>
                </div>
                <span className="font-medium">
                  {category.budgetTotal > 0 ? `${formatNumber(category.budgetTotal)} €` : <span className="text-gray-400">-</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Colonne Différence */}
      <div className="bg-gray-50 rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Différence</h3>
        <div className="space-y-2">
          {categoryTotals.map((category, index) => {
            if (!category || (category.budgetTotal === 0 && !settings.showEmptyItems)) {
              return null;
            }

            return (
              <div key={category.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 font-mono">{index + 1}</span>
                  <span className="text-gray-600">{category.name}</span>
                </div>
                <span className="text-gray-400">-</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}