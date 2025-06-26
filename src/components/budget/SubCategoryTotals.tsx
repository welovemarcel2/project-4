import React from 'react';
import { BudgetLine } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { calculateLineTotals } from '../../utils/budgetCalculations';

interface SubCategoryTotalsProps {
  items: BudgetLine[];
  level: number;
  settings: QuoteSettings;
}

export function SubCategoryTotals({ items, level, settings }: SubCategoryTotalsProps) {
  const totals = items.reduce((acc, item) => {
    const itemTotals = calculateLineTotals(item, settings);
    return {
      baseTotal: acc.baseTotal + itemTotals.baseTotal,
      socialCharges: acc.socialCharges + itemTotals.socialCharges
    };
  }, { baseTotal: 0, socialCharges: 0 });

  const indentation = level * 12;

  if (!items.length) return null;

  return (
    <>
      <tr className="border-t border-gray-200">
        <td></td>
        <td className="px-1.5 py-1" style={{ paddingLeft: `${indentation + 12}px` }}>
          <span className="text-xs font-medium">Sous-total hors charges</span>
        </td>
        <td colSpan={5}></td>
        <td className="px-1.5 py-1 text-right text-xs font-medium">{totals.baseTotal.toFixed(2)}</td>
        <td colSpan={2}></td>
      </tr>
      <tr className="border-b border-gray-200">
        <td></td>
        <td className="px-1.5 py-1" style={{ paddingLeft: `${indentation + 12}px` }}>
          <span className="text-xs font-medium">Sous-total charges sociales</span>
        </td>
        <td colSpan={5}></td>
        <td className="px-1.5 py-1 text-right text-xs font-medium">{totals.socialCharges.toFixed(2)}</td>
        <td colSpan={2}></td>
      </tr>
    </>
  );
}