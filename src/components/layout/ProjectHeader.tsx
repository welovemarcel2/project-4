import React, { useState } from 'react';
import { useUserStore } from '../../stores/userStore';
import { Project, Quote } from '../../types/project';
import { QuoteSettings } from '../../types/quoteSettings';
import { ShareProjectModal } from '../projects/ShareProjectModal';
import { BudgetCategory } from '../../types/budget';
import { usePermissions } from '../../hooks/usePermissions';
import { ArrowLeft, Share2, Save } from 'lucide-react';
import { SyncStatusIndicator } from '../budget/SyncStatusIndicator';

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
  onSaveChanges?: () => Promise<void>;
  isDirty?: boolean;
  lastSavedAt?: Date | null;
  onUpdateBudget: (budget: BudgetCategory[]) => Promise<void>;
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
  const [isSaving, setIsSaving] = useState(false);

  // Fonction pour formater la date de dernière sauvegarde
  const formatLastSavedDate = (date: Date | null) => {
    if (!date) return 'Jamais sauvegardé';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Si moins d'une minute
    if (diff < 60000) {
      return 'Il y a quelques secondes';
    }
    
    // Si moins d'une heure
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    // Sinon afficher l'heure complète
    return date.toLocaleTimeString();
  };

  // Gestion de la sauvegarde
  const handleSave = async () => {
    if (onSaveChanges) {
      setIsSaving(true);
      try {
        await onSaveChanges();
        console.log('[ProjectHeader] Changes saved successfully');
      } catch (error) {
        console.error('[ProjectHeader] Error saving changes:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

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
        {/* Indicateur de synchronisation */}
        {selectedQuote && (
          <SyncStatusIndicator quoteId={selectedQuote.id} />
        )}

        {/* Dernière sauvegarde et bouton de sauvegarde */}
        <div className="flex items-center">
          {lastSavedAt && (
            <span className="text-xs text-gray-500 mr-2" title={lastSavedAt.toLocaleString()}>
              {formatLastSavedDate(lastSavedAt)}
            </span>
          )}
          
          {onSaveChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className={`flex items-center justify-center p-2 rounded-full transition-colors ${
                isDirty
                  ? 'text-amber-600 hover:bg-amber-50'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={lastSavedAt ? `Dernière sauvegarde: ${lastSavedAt.toLocaleString()}` : 'Sauvegarder les modifications'}
            >
              <Save size={18} className={isSaving ? 'animate-pulse' : ''} />
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