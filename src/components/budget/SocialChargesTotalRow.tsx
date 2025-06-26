import React from 'react';
import { calculateSocialCharges } from '../../utils/budgetCalculations';
import { BudgetLine } from '../../types/budget';

interface SocialChargesTotalRowProps {
  items: BudgetLine[];
}

export function SocialChargesTotalRow({ items }: SocialChargesTotalRowProps) {
  // Check if any item or subitem has social charges
  const hasSocialCharges = items.some(item => {
    if (item.isParent && item.subItems) {
      return item.subItems.some(subItem => subItem.socialCharges);
    }
    return item.socialCharges;
  });

  if (!hasSocialCharges) {
    return null;
  }

  const totalCharges = items.reduce((total, item) => {
    if (item.isParent && item.subItems) {
      return total + item.subItems.reduce((subTotal, subItem) => 
        subTotal + calculateSocialCharges(
          subItem.quantity,
          subItem.number,
          subItem.rate,
          subItem.socialCharges
        ), 0
      );
    }
    return total + calculateSocialCharges(
      item.quantity,
      item.number,
      item.rate,
      item.socialCharges
    );
  }, 0);

  return (
    <tr className="border-t h-5 bg-gray-50">
      <td></td>
      <td className="px-1.5 py-0.5 text-xs italic">Total charges sociales</td>
      <td colSpan={5}></td>
      <td className="px-1.5 py-0.5 text-right text-xs italic">{totalCharges.toFixed(2)}</td>
      <td colSpan={3}></td>
    </tr>
  );
}