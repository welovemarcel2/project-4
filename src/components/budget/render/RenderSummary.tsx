import React from 'react';
import { RenderMainCategory } from './RenderTable';
import { formatNumber } from '../../../utils/formatNumber';

interface RenderSummaryProps {
  categories: RenderMainCategory[];
}

export function RenderSummary({ categories }: RenderSummaryProps) {
  const calculateTotals = () => {
    let totalHT = 0;
    let totalTTC = 0;
    let totalSocialCharges = 0;

    categories.forEach(category => {
      category.subCategories.forEach(subCategory => {
        subCategory.items.forEach(item => {
          if (item.type === 'suppliers' || item.type === 'expenses') {
            // For suppliers and expenses, use amountHT
            totalHT += item.amountHT || 0;
            totalTTC += item.amountTTC || 0;
          } else if (item.type === 'salaries') {
            // For salaries, calculate gross + social charges
            const grossSalary = item.grossSalary || 0;
            const socialChargesPercent = item.socialChargesPercent || 0;
            const socialCharges = grossSalary * (socialChargesPercent / 100);
            
            totalHT += grossSalary + socialCharges;
            totalTTC += grossSalary + socialCharges;
            totalSocialCharges += socialCharges;
          }
        });
      });
    });

    return { totalHT, totalTTC, totalSocialCharges };
  };

  const { totalHT, totalTTC, totalSocialCharges } = calculateTotals();

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Total HT</h3>
        <p className="text-2xl font-bold text-gray-900">{formatNumber(totalHT)} €</p>
        <p className="text-xs text-gray-500 mt-1">
          Inclut les salaires bruts, charges sociales et montants HT des factures
        </p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Charges Sociales</h3>
        <p className="text-2xl font-bold text-gray-900">{formatNumber(totalSocialCharges)} €</p>
        <p className="text-xs text-gray-500 mt-1">
          Total des charges sociales sur les salaires
        </p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Total TTC</h3>
        <p className="text-2xl font-bold text-gray-900">{formatNumber(totalTTC)} €</p>
        <p className="text-xs text-gray-500 mt-1">
          Inclut la TVA des factures
        </p>
      </div>
    </div>
  );
}