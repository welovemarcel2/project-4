import React from 'react';
import { ListTree, List } from 'lucide-react';

interface SocialChargesToggleProps {
  display: 'detailed' | 'grouped';
  onChange: (display: 'detailed' | 'grouped') => void;
}

export function SocialChargesToggle({ display, onChange }: SocialChargesToggleProps) {
  return (
    <button
      onClick={() => onChange(display === 'detailed' ? 'grouped' : 'detailed')}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
        display === 'detailed'
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      title={display === 'detailed' ? "Charges sociales par sous-catégorie" : "Charges sociales groupées"}
    >
      {display === 'detailed' ? (
        <>
          <ListTree size={16} />
          <span>Détaillé</span>
        </>
      ) : (
        <>
          <List size={16} />
          <span>Groupé</span>
        </>
      )}
    </button>
  );
}