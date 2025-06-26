import React from 'react';
import { GripVertical } from 'lucide-react';

interface EditorModeToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export function EditorModeToggle({ isEnabled, onToggle }: EditorModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`p-2 rounded-full transition-colors ${
        isEnabled 
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
          : 'hover:bg-gray-100 text-gray-600'
      }`}
      title={isEnabled ? "Désactiver le mode éditeur" : "Activer le mode éditeur"}
    >
      <GripVertical size={20} />
    </button>
  );
}