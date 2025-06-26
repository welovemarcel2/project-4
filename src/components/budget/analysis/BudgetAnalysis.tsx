import React from 'react';
import { BudgetCategory } from '../../../types/budget';
import { QuoteSettings } from '../../../types/quoteSettings';
import { formatNumber } from '../../../utils/formatNumber';
import { calculateLineTotal } from '../../../utils/budgetCalculations/base';
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface BudgetAnalysisProps {
  budget: BudgetCategory[];
  workBudget: BudgetCategory[];
  settings: QuoteSettings;
}

interface VarianceData {
  initialAmount: number;
  currentAmount: number;
  difference: number;
  percentageChange: number;
}

function calculateVariance(initial: number, current: number): VarianceData {
  const difference = current - initial;
  const percentageChange = initial !== 0 ? (difference / initial) * 100 : 0;

  return {
    initialAmount: initial,
    currentAmount: current,
    difference,
    percentageChange
  };
}

function getVarianceColor(variance: number): string {
  if (variance > 0) return 'text-red-600';
  if (variance < 0) return 'text-green-600';
  return 'text-gray-600';
}

function getVarianceIcon(variance: number) {
  if (variance > 0) return <ArrowUpRight size={16} className="text-red-600" />;
  if (variance < 0) return <ArrowDownRight size={16} className="text-green-600" />;
  return <Minus size={16} className="text-gray-400" />;
}

function calculateCategoryTotal(items: BudgetLine[]): number {
  return items.reduce((total, item) => {
    if (item.subItems && item.subItems.length > 0) {
      return total + calculateCategoryTotal(item.subItems);
    }
    return total + calculateLineTotal(item);
  }, 0);
}

export function BudgetAnalysis({ budget, workBudget, settings }: BudgetAnalysisProps) {
  const initialTotal = budget.reduce((acc, cat) => acc + calculateCategoryTotal(cat.items), 0);
  const currentTotal = workBudget.reduce((acc, cat) => acc + calculateCategoryTotal(cat.items), 0);
  const globalVariance = calculateVariance(initialTotal, currentTotal);

  const categoryVariances = budget.map(category => {
    const initialCategoryTotal = calculateCategoryTotal(category.items);
    const workCategory = workBudget.find(wc => wc.id === category.id);
    const currentCategoryTotal = workCategory ? calculateCategoryTotal(workCategory.items) : 0;
    
    return {
      categoryId: category.id,
      categoryName: category.name,
      variance: calculateVariance(initialCategoryTotal, currentCategoryTotal)
    };
  });

  const significantVariances = categoryVariances
    .filter(cv => Math.abs(cv.variance.percentageChange) > 5)
    .sort((a, b) => Math.abs(b.variance.percentageChange) - Math.abs(a.variance.percentageChange));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Analyse des écarts budgétaires</h2>
            <p className="text-sm text-gray-500 mt-1">
              Comparaison entre le budget initial et le budget de suivi
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50">
            <div className="text-right">
              <div className="text-sm text-gray-600">Variation globale</div>
              <div className={`text-lg font-semibold ${getVarianceColor(globalVariance.difference)}`}>
                {globalVariance.difference >= 0 ? '+' : ''}
                {formatNumber(globalVariance.difference)} € ({formatNumber(globalVariance.percentageChange)}%)
              </div>
            </div>
            {getVarianceIcon(globalVariance.difference)}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <span className="text-sm font-medium">Budget initial</span>
            </div>
            <div className="text-lg font-semibold">{formatNumber(initialTotal)} €</div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <CheckCircle2 size={16} className="text-blue-500" />
              <span className="text-sm font-medium">Budget de suivi</span>
            </div>
            <div className="text-lg font-semibold">{formatNumber(currentTotal)} €</div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              {Math.abs(globalVariance.percentageChange) > 10 ? (
                <XCircle size={16} className="text-red-500" />
              ) : (
                <CheckCircle2 size={16} className="text-green-500" />
              )}
              <span className="text-sm font-medium">État du budget</span>
            </div>
            <div className="text-sm">
              {Math.abs(globalVariance.percentageChange) > 10 
                ? "Écart significatif" 
                : "Écart acceptable"}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b">
          <h3 className="text-sm font-medium text-gray-900">Analyse par catégorie</h3>
        </div>
        
        <div className="divide-y">
          {categoryVariances.map(({ categoryId, categoryName, variance }) => (
            <div key={categoryId} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{categoryName}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Initial: {formatNumber(variance.initialAmount)} € →{' '}
                    Actuel: {formatNumber(variance.currentAmount)} €
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getVarianceIcon(variance.difference)}
                  <div className={`text-sm font-medium ${getVarianceColor(variance.difference)}`}>
                    {variance.difference >= 0 ? '+' : ''}
                    {formatNumber(variance.difference)} € ({formatNumber(variance.percentageChange)}%)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {significantVariances.length > 0 && (
        <div className="bg-amber-50 rounded-lg shadow border border-amber-200 p-6">
          <h3 className="flex items-center gap-2 text-amber-800 font-medium">
            <AlertTriangle size={16} />
            Écarts significatifs détectés
          </h3>
          <div className="mt-4 space-y-3">
            {significantVariances.map(({ categoryId, categoryName, variance }) => (
              <div key={categoryId} className="flex items-center justify-between text-sm">
                <span className="text-amber-800">{categoryName}</span>
                <span className={`font-medium ${getVarianceColor(variance.difference)}`}>
                  {variance.difference >= 0 ? '+' : ''}
                  {formatNumber(variance.percentageChange)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}