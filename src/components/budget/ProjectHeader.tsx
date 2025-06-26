import React, { useState } from 'react';
import { ArrowLeft, Table2, Share2, Plus, ChevronRight } from 'lucide-react';
import { Project, Quote } from '../../types/project';
import { QuoteList } from '../quotes/QuoteList';
import { QuoteSettings } from '../../types/quoteSettings';
import { EditorModeToggle } from './EditorModeToggle';
import { RatesGridMenu } from './rates/RatesGridMenu';
import { ShareProjectModal } from '../projects/ShareProjectModal';
import { BudgetCategory } from '../../types/budget';
import { usePermissions } from '../../hooks/usePermissions';

interface ProjectHeaderProps {
  project: Project;
  quotes: Quote[];
  selectedQuote: Quote | null;
  settings: QuoteSettings;
  isEditorMode: boolean;
  currentBudget: BudgetCategory[];
  onUpdateSettings: (settings: Partial<QuoteSettings>) => void;
  onToggleEditorMode: () => void;
  onBack: () => void;
  onSelectQuote: (quote: Quote) => void;
  onCreateQuote: () => void;
  onUpdateBudget: (budget: BudgetCategory[]) => void;
  onShareProject: (email: string, permissions: { canEdit: boolean; canShare: boolean }) => void;
}

export function ProjectHeader({
  project,
  quotes,
  selectedQuote,
  settings,
  isEditorMode,
  currentBudget,
  onUpdateSettings,
  onToggleEditorMode,
  onBack,
  onSelectQuote,
  onCreateQuote,
  onUpdateBudget,
  onShareProject
}: ProjectHeaderProps) {
  const [isRatesGridOpen, setIsRatesGridOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const permissions = usePermissions();

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold">{project.name}</h2>
              {selectedQuote && (
                <>
                  <ChevronRight size={24} className="text-gray-400" />
                  <span className="text-2xl font-semibold text-blue-600">
                    {selectedQuote.name}
                  </span>
                </>
              )}
            </div>
            <p className="text-gray-500 mt-1">{project.client}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Menu déroulant des devis et bouton nouveau */}
        <div className="flex items-center gap-2">
          <QuoteList
            quotes={quotes}
            selectedQuote={selectedQuote}
            onSelectQuote={onSelectQuote}
            onCreateQuote={onCreateQuote}
            compact={true}
          />
          <button
            onClick={onCreateQuote}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md"
          >
            <Plus size={16} />
            Nouveau
          </button>
        </div>

        {/* Bouton de partage */}
        {permissions.canManageProductionSettings && (
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
            title="Partager le projet"
          >
            <Share2 size={20} />
          </button>
        )}

        {/* Bouton de la grille tarifaire */}
        <button
          onClick={() => setIsRatesGridOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          title="Grille tarifaire"
        >
          <Table2 size={20} />
        </button>
        
        {/* Bouton de mode édition */}
        <EditorModeToggle
          isEnabled={isEditorMode}
          onToggle={onToggleEditorMode}
        />
      </div>

      {/* Menu de la grille tarifaire */}
      {isRatesGridOpen && (
        <RatesGridMenu
          isOpen={isRatesGridOpen}
          onClose={() => setIsRatesGridOpen(false)}
          budgetLang={settings.budgetLang || 'fr'}
          isEditMode={false}
          onAddToBudget={() => {}}
        />
      )}

      {/* Modal de partage */}
      <ShareProjectModal
        project={project}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onShare={onShareProject}
      />
    </div>
  );
}