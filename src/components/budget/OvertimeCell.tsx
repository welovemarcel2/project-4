import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { OvertimePopup } from './overtime/OvertimePopup';
import { OvertimeSubPosts } from '../../types/overtime';
import { BudgetLine } from '../../types/budget';
import { generateId } from '../../utils/generateId';

interface OvertimeCellProps {
  value: number;
  hasSocialCharges: boolean;
  rate: number;
  onChange: (updates: Partial<BudgetLine>) => void;
}

export function OvertimeCell({
  value,
  hasSocialCharges,
  rate,
  onChange
}: OvertimeCellProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  if (!hasSocialCharges) return null;

  const handleApply = (subPosts: OvertimeSubPosts) => {
    // Créer les sous-postes pour les heures supplémentaires
    const newSubItems: BudgetLine[] = [];

    if (subPosts.normal) {
      newSubItems.push({
        id: generateId(),
        type: 'subPost',
        parentId: null,
        name: subPosts.normal.name,
        quantity: subPosts.normal.quantity,
        number: 1,
        unit: 'Heure',
        rate: subPosts.normal.rate,
        overtime: 0,
        socialCharges: '65',
        agencyPercent: 10,
        marginPercent: 15,
        subItems: []
      });
    }

    if (subPosts.x1_5) {
      newSubItems.push({
        id: generateId(),
        type: 'subPost',
        parentId: null,
        name: subPosts.x1_5.name,
        quantity: subPosts.x1_5.quantity,
        number: 1,
        unit: 'Heure',
        rate: subPosts.x1_5.rate,
        overtime: 0,
        socialCharges: '65',
        agencyPercent: 10,
        marginPercent: 15,
        subItems: []
      });
    }

    if (subPosts.x2) {
      newSubItems.push({
        id: generateId(),
        type: 'subPost',
        parentId: null,
        name: subPosts.x2.name,
        quantity: subPosts.x2.quantity,
        number: 1,
        unit: 'Heure',
        rate: subPosts.x2.rate,
        overtime: 0,
        socialCharges: '65',
        agencyPercent: 10,
        marginPercent: 15,
        subItems: []
      });
    }

    onChange({
      subItems: newSubItems,
      isExpanded: true
    });
    
    setIsPopupOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsPopupOpen(true)}
        className="p-1 hover:bg-blue-50 rounded-full transition-colors group"
        title="Heures supplémentaires"
      >
        <Clock 
          size={14} 
          className={`${value > 0 ? 'text-blue-600' : 'text-gray-400'} group-hover:text-blue-600`}
        />
      </button>

      {isPopupOpen && (
        <OvertimePopup
          dailyRate={rate}
          onClose={() => setIsPopupOpen(false)}
          onApply={handleApply}
        />
      )}
    </div>
  );
}