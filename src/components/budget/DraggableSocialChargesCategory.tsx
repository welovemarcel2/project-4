import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { calculateSocialChargesByType } from '../../utils/budgetCalculations/socialCharges';
import { formatNumber } from '../../utils/formatNumber';

interface DraggableSocialChargesCategoryProps {
  budget: BudgetCategory[];
  settings: QuoteSettings;
}

export function DraggableSocialChargesCategory({
  budget,
  settings
}: DraggableSocialChargesCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: 'social-charges' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const chargesByType = calculateSocialChargesByType(budget, settings);
  const totalCharges = Object.values(chargesByType).reduce((a, b) => a + b, 0);

  // Obtenir les labels des taux personnalisés
  const rate1Label = settings.rateLabels?.rate1Label || 'TX 1';
  const rate2Label = settings.rateLabels?.rate2Label || 'TX 2';

  return (
    <>
      <tr ref={setNodeRef} style={style} className="group bg-blue-100/50 h-8 border-b border-blue-200/50">
        <td className="w-10 relative">
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity px-1 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} className="text-gray-400" />
          </span>
        </td>
        <td className="px-2 py-1">
          <span className="text-xs font-bold uppercase tracking-wide text-blue-900">
            Charges Sociales
          </span>
        </td>
        <td colSpan={4}></td>
        <td className="text-right px-2 py-1">
          <span className="text-xs font-bold uppercase tracking-wide text-blue-900">
            {formatNumber(totalCharges)}
          </span>
        </td>
        <td colSpan={4}></td>
      </tr>

      {settings.socialChargeRates.map(rate => {
        const amount = chargesByType[rate.id] || 0;
        if (amount === 0 && !settings.showEmptyItems) return null;

        return (
          <tr key={rate.id} className="group border-b hover:bg-gray-50/80 h-6">
            <td className="w-10"></td>
            <td className="px-2 py-0.5 pl-8">
              <span className="text-[11px]">{rate.label}</span>
            </td>
            <td colSpan={4}></td>
            <td className="text-right px-1 py-0.5">
              <span className="text-[11px]">{formatNumber(amount)}</span>
            </td>
            <td colSpan={4}></td>
          </tr>
        );
      })}
    </>
  );
}