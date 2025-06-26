import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Project, Quote, QuoteStatus } from '../../types/project';
import { QuoteList } from '../quotes/QuoteList';
import { QuoteSettings } from '../budget/QuoteSettings';
import { EditorModeToggle } from '../budget/EditorModeToggle';

interface ProjectHeaderProps {
  project: Project;
  quotes: Quote[];
  settings: QuoteSettings;
  isEditorMode: boolean;
  onUpdateSettings: (settings: Partial<QuoteSettings>) => void;
  onToggleEditorMode: () => void;
  onBack: () => void;
  onSelectQuote: (quote: Quote) => void;
  onCreateQuote: () => void;
  onUpdateQuoteStatus: (quoteId: string, status: QuoteStatus, details?: { rejectionReason?: string }) => void;
}

export function ProjectHeader({
  project,
  quotes,
  settings,
  isEditorMode,
  onUpdateSettings,
  onToggleEditorMode,
  onBack,
  onSelectQuote,
  onCreateQuote,
  onUpdateQuoteStatus
}: ProjectHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-semibold">{project.name}</h2>
          <p className="text-gray-500">{project.client}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <EditorModeToggle
          isEnabled={isEditorMode}
          onToggle={onToggleEditorMode}
        />
        
        <QuoteSettings
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onUpdateAllRates={() => {}}
        />
        
        <QuoteList
          quotes={quotes}
          onSelectQuote={onSelectQuote}
          onCreateQuote={onCreateQuote}
          onUpdateQuoteStatus={onUpdateQuoteStatus}
          compact={true}
        />
      </div>
    </div>
  );
}