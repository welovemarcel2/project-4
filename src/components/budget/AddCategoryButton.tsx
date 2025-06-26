import React from 'react';
import { FolderPlus } from 'lucide-react';

interface AddCategoryButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AddCategoryButton({ onClick, disabled = false }: AddCategoryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 rounded-md transition-all hover:bg-blue-50/80 w-full justify-center my-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title="Ajouter une catégorie"
      disabled={disabled}
    >
      <FolderPlus size={16} className="text-blue-500" />
      <span className="font-medium">
        Ajouter une catégorie
      </span>
    </button>
  );
}