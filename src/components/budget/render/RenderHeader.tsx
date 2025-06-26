import React from 'react';
import { FileDown, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatNumber } from '../../../utils/formatNumber';

interface RenderHeaderProps {
  isCompleted: boolean;
  onStatusChange: (completed: boolean) => void;
  initialBudget: number;
  currentTotal: number;
  onExport: () => void;
}

export function RenderHeader({
  isCompleted,
  onStatusChange,
  initialBudget,
  currentTotal,
  onExport
}: RenderHeaderProps) {
  // Calculate margin and percentage
  const margin = currentTotal - initialBudget;
  const marginPercent = initialBudget > 0 ? (margin / initialBudget) * 100 : 0;
  
  // Determine status color and icon
  const getStatusColor = () => {
    if (isCompleted) {
      return margin >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    }
    return 'bg-amber-100 text-amber-800';
  };
  
  const getStatusIcon = () => {
    if (isCompleted) {
      return margin >= 0 ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />;
    }
    return <Clock size={16} />;
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Statut du rendu</label>
            <div className="mt-1">
              <button
                onClick={() => onStatusChange(!isCompleted)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${getStatusColor()}`}
              >
                {getStatusIcon()}
                {isCompleted ? 'Terminé' : 'En cours'}
              </button>
            </div>
          </div>

          {isCompleted && (
            <div className="border-l pl-4">
              <div className="text-sm text-gray-600">Marge finale</div>
              <div className={`text-lg font-semibold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {margin >= 0 ? '+' : ''}{formatNumber(margin)} € ({formatNumber(marginPercent)}%)
              </div>
              <div className="text-xs text-gray-500">
                Basée sur le total HT du rendu
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          <FileDown size={16} />
          Exporter le rendu
        </button>
      </div>
    </div>
  );
}