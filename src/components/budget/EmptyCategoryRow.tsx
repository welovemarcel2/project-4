import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyCategoryRowProps {
  onAddItem: () => void;
}

export function EmptyCategoryRow({ onAddItem }: EmptyCategoryRowProps) {
  return (
    <tr className="h-12 hover:bg-gray-50">
      <td colSpan={10} className="text-center">
        <button
          onClick={onAddItem}
          className="flex items-center gap-2 px-3 py-1.5 mx-auto text-sm text-gray-600 hover:text-gray-900"
        >
          <Plus size={16} />
          Ajouter un poste
        </button>
      </td>
    </tr>
  );
}