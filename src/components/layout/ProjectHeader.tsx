import React, { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { Project, Quote, QuoteStatus } from '../../types/project';
import { QuoteSettings } from '../../types/quoteSettings';
import { ShareProjectModal } from '../projects/ShareProjectModal';
import { BudgetCategory } from '../../types/budget';
import { usePermissions } from '../../hooks/usePermissions';
import { ArrowLeft, Share2, Save } from 'lucide-react';

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
  onShareProject?: (email: string, permissions: { canEdit: boolean; canShare: boolean }) => void;
  onSaveChanges?: () => void;
  isDirty?: boolean;
  lastSavedAt?: Date;
  onUpdateBudget: (budget: BudgetCategory[]) => void;
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
  onShareProject,
  onSaveChanges,
  isDirty,
  lastSavedAt,
  onUpdateBudget
}: ProjectHeaderProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const permissions = usePermissions();

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          title="Retour"
        >
          <ArrowLeft size={18} />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-gray-900">{project.name}</h2>
            {selectedQuote && (
              <>
                <span className="text-gray-400">/</span>
                <span className="text-lg font-medium text-blue-600">
                  {selectedQuote.name}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{project.client}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">

        <div className="flex items-center">
          {onSaveChanges && (
            <button
              onClick={onSaveChanges}
              className={`flex items-center justify-center p-2 rounded-full transition-colors ${
                isDirty
                  ? 'text-amber-600 hover:bg-amber-50'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={lastSavedAt ? `Dernière sauvegarde le ${new Date(lastSavedAt).toLocaleString()}` : undefined}
            >
              <Save size={18} />
            </button>
          )}

          {permissions.canManageProductionSettings && onShareProject && (
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full flex items-center justify-center"
              title="Partager le projet"
            >
              <Share2 size={18} />
            </button>
          )}
        </div>
      </div>

      {onShareProject && (
        <ShareProjectModal
          project={project}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onShare={onShareProject}
        />
      )}
    </div>
  );
}