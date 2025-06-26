import React from 'react';
import { FileText } from 'lucide-react';

interface AddPostButtonProps {
  onClick: () => void;
  level: number;
  disabled?: boolean;
}

export function AddPostButton({ onClick, level, disabled = false }: AddPostButtonProps) {
  const indentation = level * 20 + 8;
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 rounded-md transition-all hover:bg-blue-50/80 my-1 ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      style={{ marginLeft: `${indentation}px` }}
      title="Ajouter un poste"
      disabled={disabled}
    >
      <FileText size={14} className="text-blue-500" />
      <span className="font-medium">
        Ajouter un poste
      </span>
    </button>
  );
}