import React from 'react';
import { Trash2 } from 'lucide-react';

interface DeleteButtonProps {
  onClick: () => void;
  type: 'category' | 'subCategory' | 'post' | 'subPost';
  disabled?: boolean;
}

export function DeleteButton({ onClick, type, disabled = false }: DeleteButtonProps) {
  const getTooltip = () => {
    switch (type) {
      case 'category': return 'Supprimer la catégorie';
      case 'subCategory': return 'Supprimer la sous-catégorie';
      case 'post': return 'Supprimer le poste';
      case 'subPost': return 'Supprimer le sous-poste';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`opacity-0 group-hover:opacity-100 z-10 inline-flex items-center p-1 hover:bg-red-50 rounded transition-all ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      }`}
      title={getTooltip()}
      disabled={disabled}
    >
      <Trash2 size={14} className="text-red-500" />
    </button>
  );
}