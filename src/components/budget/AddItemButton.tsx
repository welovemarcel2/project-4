import React from 'react';
import { Plus } from 'lucide-react';

interface AddItemButtonProps {
  onClick: () => void;
  label: string;
  level?: number;
  compact?: boolean;
}

export function AddItemButton({ onClick, label, level = 0, compact = false }: AddItemButtonProps) {
  const indentation = level * 20;
  
  if (compact) {
    return (
      <button
        onClick={onClick}
        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-50 rounded transition-opacity"
        title={label}
      >
        <Plus size={14} className="text-blue-600" />
      </button>
    );
  }

  return (
    <tr className="h-10">
      <td colSpan={10}>
        <button
          onClick={onClick}
          className="flex items-center gap-2 px-3 py-1.5 mx-auto text-sm text-blue-600 hover:text-blue-800"
          style={{ marginLeft: `${indentation}px` }}
        >
          <Plus size={14} />
          {label}
        </button>
      </td>
    </tr>
  );
}