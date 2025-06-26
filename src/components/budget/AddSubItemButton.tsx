import React from 'react';
import { Plus } from 'lucide-react';

interface AddSubItemButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AddSubItemButton({ onClick, disabled = false }: AddSubItemButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-50 rounded transition-opacity ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title="Ajouter un sous-poste"
      disabled={disabled}
    >
      <Plus size={14} className="text-blue-600" />
    </button>
  );
}