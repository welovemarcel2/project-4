import React from 'react';
import { BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { calculateTotalCosts } from '../../utils/budgetCalculations';

interface MarginsSummaryProps {
  categories: BudgetCategory[];
  settings: QuoteSettings;
}

export function MarginsSummary({ categories, settings }: MarginsSummaryProps) {
  const { agency, margin } = calculateTotalCosts(categories, settings);

  return (
    <>
      <tr className="bg-blue-100 h-6">
        <td></td>
        <td className="px-1.5 py-0.5">
          <span className="text-base font-semibold">Marges et frais généraux</span>
        </td>
        <td colSpan={7}></td>
        <td className="px-1.5 py-0.5 text-right text-xs"></td>
      </tr>
      <tr className="h-5 hover:bg-gray-50">
        <td></td>
        <td className="px-1.5 py-0.5 pl-4 text-xs">Frais généraux</td>
        <td colSpan={7}></td>
        <td className="px-1.5 py-0.5 text-right text-xs">{agency.toFixed(2)}</td>
      </tr>
      <tr className="h-5 hover:bg-gray-50">
        <td></td>
        <td className="px-1.5 py-0.5 pl-4 text-xs">Marge</td>
        <td colSpan={7}></td>
        <td className="px-1.5 py-0.5 text-right text-xs">{margin.toFixed(2)}</td>
      </tr>
      <tr className="h-5 hover:bg-gray-50 font-medium">
        <td></td>
        <td className="px-1.5 py-0.5 text-xs">Total</td>
        <td colSpan={7}></td>
        <td className="px-1.5 py-0.5 text-right text-xs">
          {(agency + margin).toFixed(2)}
        </td>
      </tr>
    </>
  );
}