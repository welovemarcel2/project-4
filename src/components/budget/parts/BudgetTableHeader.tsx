import React from 'react';

interface BudgetTableHeaderProps {
  rate1Label: string;
  rate2Label: string;
  showExpenseDistribution: boolean;
  expenseCategories: { id: string; name: string; color: string }[];
}

export const BudgetTableHeader: React.FC<BudgetTableHeaderProps> = ({
  rate1Label,
  rate2Label,
  showExpenseDistribution,
  expenseCategories,
}) => (
  <thead>
    <tr className="bg-gray-50 border-b">
      <th className="w-6"></th>
      <th className="text-left px-1.5 py-1.5 min-w-[300px] text-xs font-medium text-gray-600 sticky left-0 bg-gray-50">
        Ligne de coût
      </th>
      <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Qté</th>
      <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Nb</th>
      <th className="text-center px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Unité</th>
      <th className="text-right px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Tarif</th>
      <th className="text-right px-1.5 py-1.5 w-20 text-xs font-medium text-gray-600">Total</th>
      <th className="text-center px-1.5 py-1.5 w-8 text-xs font-medium text-gray-600">H.S.</th>
      <th className="text-center px-1.5 py-1.5 w-8 text-xs font-medium text-gray-600">€</th>
      <th className="text-center px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Ch. Soc.</th>
      <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">{rate1Label}</th>
      <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">{rate2Label}</th>
      <th className="text-center px-1.5 py-1.5 w-24 text-xs font-medium text-gray-600">Répartition</th>
      {/* Colonnes de répartition dynamiques */}
      {showExpenseDistribution && expenseCategories.map(category => (
        <th 
          key={category.id} 
          className="text-right px-1.5 py-1.5 w-24 text-xs font-medium text-gray-600"
          style={{ borderLeft: `2px solid ${category.color}` }}
        >
          {category.name}
        </th>
      ))}
    </tr>
  </thead>
); 