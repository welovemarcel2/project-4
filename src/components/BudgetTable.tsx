import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { BudgetCategory, BudgetLine } from '../types/budget';

const initialBudget: BudgetCategory[] = [
  {
    id: '1',
    name: 'IA - Production',
    isExpanded: true,
    items: [
      {
        id: '1-1',
        name: 'Line Producer',
        quantity: 1,
        number: 1,
        unit: 'Jour',
        rate: 500,
        socialCharges: 'Shooting Crew',
        agencyPercent: 15,
        marginPercent: 10,
        expenses: 0
      },
      {
        id: '1-2',
        name: 'Director of Photography',
        quantity: 1,
        number: 1,
        unit: 'Jour',
        rate: 800,
        socialCharges: 'Shooting Crew',
        agencyPercent: 15,
        marginPercent: 10,
        expenses: 0
      }
    ]
  }
];

export function BudgetTable() {
  const [budget, setBudget] = useState<BudgetCategory[]>(initialBudget);

  const toggleCategory = (categoryId: string) => {
    setBudget(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
    ));
  };

  const calculateTotal = (line: BudgetLine) => {
    const baseTotal = line.quantity * line.number * line.rate;
    const withAgency = baseTotal * (1 + line.agencyPercent / 100);
    const withMargin = withAgency * (1 + line.marginPercent / 100);
    return withMargin + line.expenses;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-left">Ligne de coût</th>
            <th className="p-2">Quantité</th>
            <th className="p-2">Nombre</th>
            <th className="p-2">Unité</th>
            <th className="p-2">Tarifs</th>
            <th className="p-2">Total</th>
            <th className="p-2">Charges sociales</th>
            <th className="p-2">Agence %</th>
            <th className="p-2">Marge %</th>
            <th className="p-2">Frais G.</th>
          </tr>
        </thead>
        <tbody>
          {budget.map(category => (
            <React.Fragment key={category.id}>
              <tr className="bg-blue-100">
                <td className="p-2 flex items-center">
                  <button 
                    onClick={() => toggleCategory(category.id)}
                    className="mr-2"
                  >
                    {category.isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {category.name}
                </td>
                <td colSpan={9}></td>
              </tr>
              {category.isExpanded && category.items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className="p-2 pl-8">{item.name}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2 text-center">{item.number}</td>
                  <td className="p-2 text-center">{item.unit}</td>
                  <td className="p-2 text-right">{item.rate.toFixed(2)}</td>
                  <td className="p-2 text-right">{calculateTotal(item).toFixed(2)}</td>
                  <td className="p-2 text-center">{item.socialCharges}</td>
                  <td className="p-2 text-center">{item.agencyPercent}</td>
                  <td className="p-2 text-center">{item.marginPercent}</td>
                  <td className="p-2 text-right">{item.expenses.toFixed(2)}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}