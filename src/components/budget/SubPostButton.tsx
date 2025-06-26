import React from 'react';
import { Plus } from 'lucide-react';

interface SubPostButtonProps {
  onClick?: () => void;
}

export function SubPostButton({ onClick }: SubPostButtonProps) {
  if (!onClick) return null;
  
  return (
    <tr className="h-8 hover:bg-gray-50/50">
      <td colSpan={10}>
        <button
          onClick={onClick}
          className="flex items-center gap-2 px-3 py-1.5 mx-auto text-sm text-blue-600 hover:text-blue-800"
        >
          <Plus size={14} />
          Ajouter un sous-poste
        </button>
      </td>
    </tr>
  );
}