import React, { useState } from 'react';
import { BookTemplate as FileTemplate } from 'lucide-react';
import { TemplatesMenu } from './TemplatesMenu';
import { BudgetCategory } from '../../types/budget';

interface TemplatesButtonProps {
  currentBudget: BudgetCategory[];
  onApplyTemplate: (budget: BudgetCategory[]) => void;
}

export function TemplatesButton({ currentBudget, onApplyTemplate }: TemplatesButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsMenuOpen(true)}
        className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
        title="Modèles"
      >
        <FileTemplate size={20} />
      </button>

      <TemplatesMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentBudget={currentBudget}
        onApplyTemplate={onApplyTemplate}
      />
    </>
  );
}