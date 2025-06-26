import React, { useState } from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { calculateOptimalRates } from '../../utils/budgetCalculations/rateOptimization';

interface TotalCostInputProps {
  baseAmount: number;
  socialCharges: number;
  agencyPercent: number;
  marginPercent: number;
  onUpdateRates: (newAgencyPercent: number, newMarginPercent: number) => void;
}

export function TotalCostInput({
  baseAmount,
  socialCharges,
  agencyPercent,
  marginPercent,
  onUpdateRates
}: TotalCostInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseCost = baseAmount + socialCharges;
  const currentTotal = baseCost * (1 + agencyPercent/100 + marginPercent/100);

  const handleTotalUpdate = (newTotalStr: string) => {
    const newTotal = parseFloat(newTotalStr);
    if (isNaN(newTotal) || newTotal <= 0) {
      setError("Le montant doit être un nombre positif");
      return;
    }

    if (newTotal <= baseCost) {
      setError(`Le montant doit être supérieur à ${formatNumber(baseCost)}`);
      return;
    }

    try {
      // Calcul des taux optimaux
      const { agencyRate, marginRate } = calculateOptimalRates(
        baseCost,
        newTotal,
        0 // FG à 0
      );

      setError(null);
      onUpdateRates(
        0, // FG toujours à 0
        marginRate // Garde la précision complète pour la marge
      );
      setIsEditing(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="relative group">
      {isEditing ? (
        <div className="flex flex-col">
          <input
            type="number"
            defaultValue={currentTotal.toFixed(2)}
            onChange={(e) => handleTotalUpdate(e.target.value)}
            onBlur={() => setIsEditing(false)}
            className="w-24 text-right px-1 py-0.5 text-xs border rounded"
            step="0.01"
            min={baseCost}
            autoFocus
          />
          {error && (
            <div className="absolute top-full right-0 mt-1 w-48 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 z-10">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <span
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded text-xs inline-block min-w-[60px] text-right"
            title="Cliquez pour modifier le coût total"
          >
            {formatNumber(currentTotal)}
          </span>
          <div className="absolute top-full right-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
            Cliquez pour ajuster le montant total
          </div>
        </div>
      )}
    </div>
  );
}