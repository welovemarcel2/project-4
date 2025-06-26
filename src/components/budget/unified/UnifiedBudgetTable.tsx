import React from 'react';
import { BudgetCategory, BudgetLine, BudgetItemType } from '../../../types/budget';
import { Quote } from '../../../types/project';
import { QuoteSettings } from '../../../types/quoteSettings';
import { formatNumber } from '../../../utils/formatNumber';
import { calculateLineTotal } from '../../../utils/budgetCalculations/base';
import { Plus, ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, Minus, FileText } from 'lucide-react';
import { SocialChargesCell } from '../SocialChargesCell';

interface UnifiedBudgetTableProps {
  budget: BudgetCategory[];
  workBudget: BudgetCategory[];
  settings: QuoteSettings;
  selectedQuote: Quote;
  additiveQuotes: Quote[];
  allBudgets: Record<string, BudgetCategory[]>;
  onAddItem: (categoryId: string | null, parentId: string | null, type: BudgetItemType) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: Partial<BudgetLine>) => void;
}

// ... (autres fonctions utilitaires inchangées)

function BudgetSection({ 
  title,
  subtitle,
  budget,
  workBudget,
  settings,
  onAddItem,
  onUpdateItem,
  className = '',
  type = 'main'
}: { 
  title: string;
  subtitle?: string;
  budget: BudgetCategory[];
  workBudget: BudgetCategory[];
  settings: QuoteSettings;
  onAddItem: (categoryId: string | null, parentId: string | null, type: BudgetItemType) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: Partial<BudgetLine>) => void;
  className?: string;
  type?: 'main' | 'additive';
}) {
  // ... (reste du code de BudgetSection inchangé)

  return (
    <div className={`space-y-4 ${className}`}>
      <div className={`px-4 py-3 rounded-t-lg border-b ${
        type === 'main' 
          ? 'bg-blue-50 border-blue-100' 
          : 'bg-amber-50 border-amber-100'
      }`}>
        <div className="flex items-center gap-2">
          <FileText size={16} className={type === 'main' ? 'text-blue-600' : 'text-amber-600'} />
          <div>
            <h3 className={`text-sm font-medium ${
              type === 'main' ? 'text-blue-900' : 'text-amber-900'
            }`}>
              {title}
            </h3>
            {subtitle && (
              <p className={`text-xs mt-0.5 ${
                type === 'main' ? 'text-blue-600' : 'text-amber-600'
              }`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Reste du code inchangé */}
    </div>
  );
}

export function UnifiedBudgetTable({
  budget,
  workBudget,
  settings,
  selectedQuote,
  additiveQuotes,
  allBudgets,
  onAddItem,
  onUpdateItem
}: UnifiedBudgetTableProps) {
  // Calculer les totaux pour chaque budget
  const calculateBudgetTotal = (budget: BudgetCategory[]) => {
    return budget.reduce((total, category) => {
      return total + category.items.reduce((catTotal, item) => {
        return catTotal + calculateLineTotal(item);
      }, 0);
    }, 0);
  };

  // Récupérer tous les budgets des additifs
  const additiveBudgets = additiveQuotes.map(additive => ({
    quote: additive,
    budget: allBudgets[additive.id] || [],
    total: calculateBudgetTotal(allBudgets[additive.id] || [])
  }));

  const mainBudgetTotal = calculateBudgetTotal(budget);

  return (
    <div className="space-y-8">
      {/* Budget principal */}
      <BudgetSection
        title={`Budget Principal - ${selectedQuote.name}`}
        subtitle={`Total : ${formatNumber(mainBudgetTotal)} €`}
        budget={budget}
        workBudget={workBudget}
        settings={settings}
        onAddItem={onAddItem}
        onUpdateItem={onUpdateItem}
        type="main"
      />

      {/* Budgets additifs */}
      {additiveBudgets.map(({ quote, budget: additiveBudget, total }) => (
        <BudgetSection
          key={quote.id}
          title={`Additif - ${quote.name}`}
          subtitle={`Total : ${formatNumber(total)} €`}
          budget={additiveBudget}
          workBudget={workBudget}
          settings={settings}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          type="additive"
          className="border-t pt-4"
        />
      ))}

      {/* Total général */}
      <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center">
          <span className="font-medium text-gray-900">Total Général</span>
          <span className="font-bold text-gray-900">
            {formatNumber(mainBudgetTotal + additiveBudgets.reduce((acc, { total }) => acc + total, 0))} €
          </span>
        </div>
      </div>
    </div>
  );
}