import React from 'react';
import { FileSignature } from 'lucide-react';

interface AddSubPostButtonProps {
  onClick: () => void;
  level: number;
}

export function AddSubPostButton({ onClick, level }: AddSubPostButtonProps) {
  // Augmenter l'indentation en ajoutant 32px au lieu de 24px
  const indentation = level * 20 + 32;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 rounded-md transition-all hover:bg-blue-50/80 my-1"
      style={{ marginLeft: `${indentation}px` }}
      title="Ajouter un sous-poste"
    >
      <FileSignature size={14} className="text-blue-500" />
      <span className="font-medium">
        Ajouter un sous-poste
      </span>
    </button>
  );
}