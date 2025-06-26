import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { OvertimePopup } from './OvertimePopup';
import { OvertimeData } from '../../../types/overtime';
import { BudgetLine } from '../../../types/budget';
import { calculateOvertimeRates } from '../../../utils/overtime/calculations';

interface OvertimeCellProps {
  value: number;
  hasSocialCharges: boolean;
  rate: number;
  onChange: (updates: Partial<BudgetLine>) => void;
  disabled?: boolean;
  overtimeDetails?: string;
}

export function OvertimeCell({
  value,
  hasSocialCharges,
  rate,
  onChange,
  disabled = false,
  overtimeDetails
}: OvertimeCellProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  if (!hasSocialCharges) return null;

  // Parse existing overtime details if available
  const getInitialOvertimeData = (): OvertimeData | undefined => {
    if (overtimeDetails) {
      try {
        const details = JSON.parse(overtimeDetails);
        if (!details) return undefined;
        // Calculate rates based on the daily rate
        const baseHours = details.baseHours || 8;
        const rates = calculateOvertimeRates(rate, baseHours);
        return {
          baseHours,
          normalHours: details.normalHours || 0,
          x1_5Hours: details.x1_5Hours || 0,
          x2Hours: details.x2Hours || 0,
          rates
        };
      } catch (e) {
        console.error('Error parsing overtime details:', e);
        return undefined;
      }
    } else if ((onChange as any)?.baseHours !== undefined) {
      // Si le poste a un champ baseHours, l'utiliser
      const baseHours = (onChange as any).baseHours;
      const rates = calculateOvertimeRates(rate, baseHours);
      return {
        baseHours,
        normalHours: 0,
        x1_5Hours: 0,
        x2Hours: 0,
        rates
      };
    }
    return undefined;
  };

  const handleApply = (updates: Partial<BudgetLine>) => {
    // Pass the updates directly to the parent component
    onChange(updates);
    setIsPopupOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsPopupOpen(true)}
        className={`p-1 hover:bg-blue-50 rounded-full transition-colors group ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title="Heures supplémentaires"
        disabled={disabled}
      >
        <Clock 
          size={14} 
          className={`${value > 0 ? 'text-blue-600' : 'text-gray-400'} group-hover:text-blue-600`}
        />
      </button>

      {isPopupOpen && (
        <OvertimePopup
          initialData={getInitialOvertimeData()}
          dailyRate={rate}
          onClose={() => setIsPopupOpen(false)}
          onApply={handleApply}
        />
      )}
    </div>
  );
}