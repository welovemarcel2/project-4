import React from 'react';
import { Quote } from '../../types/project';
import { BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { CreateQuoteWizard } from './CreateQuoteWizard';

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    name: string; 
    type: 'main' | 'additive'; 
    parentQuoteId?: string; 
    initialBudget?: BudgetCategory[];
    settings?: Partial<QuoteSettings>;
  }) => void;
  existingQuotes: Quote[];
  projectSettings?: QuoteSettings;
}

export function CreateQuoteModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  existingQuotes,
  projectSettings
}: CreateQuoteModalProps) {
  // Utiliser le composant CreateQuoteWizard
  return (
    <CreateQuoteWizard
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      existingQuotes={existingQuotes}
      projectSettings={projectSettings}
    />
  );
}