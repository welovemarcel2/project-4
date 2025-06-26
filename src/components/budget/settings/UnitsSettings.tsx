import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BudgetUnit, PROTECTED_UNITS } from '../../../types/budget';

interface UnitsSettingsProps {
  units: BudgetUnit[];
  onChange: (units: BudgetUnit[]) => void;
}

export function UnitsSettings({ units, onChange }: UnitsSettingsProps) {
  const handleAdd = () => {
    onChange([...units, 'Unités' as BudgetUnit]);
  };

  const handleUpdate = (index: number, value: string) => {
    onChange(units.map((unit, i) => 
      i === index ? value as BudgetUnit : unit
    ));
  };

  const handleDelete = (index: number) => {
    onChange(units.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-gray-900">Unités disponibles</h4>
      <p className="text-sm text-gray-500">
        L'unité "%" est protégée car elle est liée à une fonction avancée du devis et ne peut pas être supprimée.
      </p>
      
      <div className="space-y-2">
        {units.map((unit, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              disabled={PROTECTED_UNITS.includes(unit)}
              value={unit}
              onChange={(e) => handleUpdate(index, e.target.value)}
              className={`flex-1 px-2 py-1 text-sm border rounded ${
                PROTECTED_UNITS.includes(unit) ? 'bg-gray-50 text-gray-500' : ''
              }`}
            />
            <button
              onClick={() => handleDelete(index)}
              disabled={PROTECTED_UNITS.includes(unit)}
              title={PROTECTED_UNITS.includes(unit) ? "Cette unité ne peut pas être supprimée" : "Supprimer l'unité"}
              className={`p-1 rounded ${
                PROTECTED_UNITS.includes(unit)
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
      >
        <Plus size={14} />
        Ajouter une unité
      </button>
    </div>
  );
}