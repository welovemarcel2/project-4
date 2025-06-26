import React from 'react';
import { BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { calculateTotalCosts } from '../../utils/budgetCalculations';

interface SocialChargesSummaryProps {
  categories: BudgetCategory[];
  settings: QuoteSettings;
}

export function SocialChargesSummary({ categories, settings }: SocialChargesSummaryProps) {
  const { socialCharges } = calculateTotalCosts(categories, settings);

  if (!socialCharges) return null;

  return (
    <tr className="h-5 hover:bg-gray-50 font-medium">
      <td></td>
      <td className="px-1.5 py-0.5 text-xs">Total charges sociales</td>
      <td colSpan={7}></td>
      <td className="px-1.5 py-0.5 text-right text-xs">{socialCharges.toFixed(2)}</td>
    </tr>
  );
}