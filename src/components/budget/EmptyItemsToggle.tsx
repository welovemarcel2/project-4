import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface EmptyItemsToggleProps {
  showEmptyItems: boolean;
  onChange: (show: boolean) => void;
}

export function EmptyItemsToggle({ showEmptyItems, onChange }: EmptyItemsToggleProps) {
  return (
    <button
      onClick={() => onChange(!showEmptyItems)}
      className={`p-2 hover:bg-gray-100 rounded-full transition-colors ${
        showEmptyItems ? 'text-gray-600' : 'text-blue-600'
      }`}
      title={showEmptyItems ? "Masquer les postes vides" : "Afficher les postes vides"}
    >
      {showEmptyItems ? <Eye size={20} /> : <EyeOff size={20} />}
    </button>
  );
}