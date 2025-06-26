import React, { useState } from 'react';
import { X } from 'lucide-react';
import { OvertimeData } from '../../../types/overtime';
import { calculateOvertimeRates } from '../../../utils/overtime/calculations';
import { formatNumber } from '../../../utils/formatNumber';
import { BudgetLine } from '../../../types/budget';

interface OvertimePopupProps {
  initialData?: OvertimeData;
  dailyRate: number;
  onClose: () => void;
  onApply: (updates: Partial<BudgetLine>) => void;
}

export function OvertimePopup({
  initialData,
  dailyRate,
  onClose,
  onApply
}: OvertimePopupProps) {
  const [baseHours, setBaseHours] = useState(initialData?.baseHours || 8);
  const [normalHours, setNormalHours] = useState(initialData?.normalHours || 0);
  const [x1_5Hours, setX1_5Hours] = useState(initialData?.x1_5Hours || 0);
  const [x2Hours, setX2Hours] = useState(initialData?.x2Hours || 0);

  const rates = calculateOvertimeRates(dailyRate, baseHours);

  const calculateTotal = () => {
    return (
      normalHours * rates.normal +
      x1_5Hours * rates.x1_5 +
      x2Hours * rates.x2
    );
  };

  const handleApply = () => {
    const total = calculateTotal();
    const details = {
      baseHours,
      normalHours,
      normalRate: rates.normal,
      x1_5Hours,
      x1_5Rate: rates.x1_5,
      x2Hours,
      x2Rate: rates.x2,
      total
    };

    onApply({
      overtime: total,
      overtimeDetails: JSON.stringify(details)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            Heures supplémentaires
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heures de base par jour
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={baseHours}
                onChange={(e) => setBaseHours(parseFloat(e.target.value) || 8)}
                className="w-20 px-2 py-1 text-sm border rounded"
                min="1"
                max="24"
                step="0.5"
              />
              <span className="text-sm text-gray-500">
                heures ({formatNumber(dailyRate / baseHours)}€/h)
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heures normales
              </label>
              <input
                type="number"
                value={normalHours}
                onChange={(e) => setNormalHours(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border rounded"
                min="0"
                step="0.5"
              />
              <p className="text-xs text-gray-500 mt-0.5">
                Tarif horaire : {formatNumber(rates.normal)}€
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heures à +50%
              </label>
              <input
                type="number"
                value={x1_5Hours}
                onChange={(e) => setX1_5Hours(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border rounded"
                min="0"
                step="0.5"
              />
              <p className="text-xs text-gray-500 mt-0.5">
                Tarif horaire : {formatNumber(rates.x1_5)}€
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heures à +100%
              </label>
              <input
                type="number"
                value={x2Hours}
                onChange={(e) => setX2Hours(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-sm border rounded"
                min="0"
                step="0.5"
              />
              <p className="text-xs text-gray-500 mt-0.5">
                Tarif horaire : {formatNumber(rates.x2)}€
              </p>
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm font-medium flex justify-between">
              <span>Total heures supplémentaires :</span>
              <span>{formatNumber(calculateTotal())}€</span>
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
          >
            Annuler
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}