import React, { useState, useEffect } from 'react';
import { BudgetCategory, BudgetLine, BudgetItemType } from '../../types/budget';
import { Quote, Project } from '../../types/project';
import { QuoteSettings } from '../../types/quoteSettings';
import { BudgetTable } from './BudgetTable';
import { DraggableBudgetTable } from './DraggableBudgetTable';
import { WorkTable, WorkLine } from './WorkTable';
import { RenderTable } from './render/RenderTable';
import { RotateCcw, ArrowLeft } from 'lucide-react';

type TabId = 'budget' | 'work' | 'render';

interface TabButtonProps {
  id: TabId;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function TabButton({ id, label, isActive, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? 'text-blue-600 border-b-2 border-blue-600'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

interface BudgetTabsProps {
  budget: BudgetCategory[];
  workBudget: BudgetCategory[];
  settings: QuoteSettings;
  selectedQuote: Quote;
  project: Project;
  notes: string;
  isEditorMode: boolean;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
  onUpdateBudget: (budget: BudgetCategory[]) => void;
  onAddItem: (categoryId: string | null, parentId: string | null, type: BudgetItemType) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: Partial<BudgetLine>, saveToBackend?: boolean) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onUpdateCategory: (categoryId: string, updates: Partial<BudgetCategory>) => void;
  onUpdateSettings: (settings: Partial<QuoteSettings>) => void;
  onUpdateNotes: (notes: string) => void;
  onActivateWorkBudget?: () => void;
  onResetWorkBudget?: () => void;
  onSaveChanges?: () => void;
  isDirty?: boolean;
  quoteId: string;
  additiveQuotes: Quote[];
  additiveQuoteBudgets: Record<string, BudgetCategory[]>;
  onToggleEditorMode: () => void;
}

export function BudgetTabs({
  budget,
  workBudget,
  settings,
  selectedQuote,
  project,
  notes,
  isEditorMode,
  activeTab: externalActiveTab,
  onTabChange,
  onUpdateBudget,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onUpdateCategory,
  onUpdateSettings,
  onUpdateNotes,
  onActivateWorkBudget,
  onResetWorkBudget,
  onSaveChanges,
  isDirty,
  quoteId,
  additiveQuotes,
  additiveQuoteBudgets,
  onToggleEditorMode
}: BudgetTabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabId>('budget');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isForceEditing, setIsForceEditing] = useState(false);
  const [simpleWorkBudget, setSimpleWorkBudget] = useState<WorkLine[]>([]);
  
  // Use external tab if provided, otherwise use internal state
  const activeTab = externalActiveTab || internalActiveTab;
  
  // Update settings when the component mounts or when the quote display settings change
  useEffect(() => {
    if (selectedQuote.displays) {
      // Apply the quote-specific display settings
      onUpdateSettings({
        showEmptyItems: selectedQuote.displays.showEmptyItems,
        socialChargesDisplay: selectedQuote.displays.socialChargesDisplay,
        applySocialChargesMargins: selectedQuote.displays.applySocialChargesMargins
      });
    }
  }, [selectedQuote.displays]);
  
  const handleTabChange = (tab: TabId) => {
    if (tab === 'work' && onActivateWorkBudget) {
      onActivateWorkBudget();
    }
    
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const handleResetWorkBudget = () => {
    if (onResetWorkBudget) {
      onResetWorkBudget();
      setShowResetConfirm(false);
      handleTabChange('budget');
      setIsForceEditing(false);
    }
  };

  const handleForceEdit = () => {
    setIsForceEditing(true);
  };

  const handleReorderCategories = (startIndex: number, endIndex: number) => {
    const newBudget = [...budget];
    const [movedCategory] = newBudget.splice(startIndex, 1);
    newBudget.splice(endIndex, 0, movedCategory);
    onUpdateBudget(newBudget);
  };

  const TableComponent = isEditorMode ? DraggableBudgetTable : BudgetTable;

  // Vérifier si le budget de travail est actif
  // Ne désactiver les boutons que si on est dans l'onglet work ET qu'il y a un budget de travail
  const isWorkBudgetActive = activeTab === 'work' && workBudget && workBudget.length > 0;

  // Vérifier si c'est un budget principal
  const isMainQuote = selectedQuote.type === 'main';

  // Sauvegarder automatiquement les changements lors du changement d'onglet
  const handleSaveBeforeTabChange = (tab: TabId) => {
    if (onSaveChanges && isDirty) {      
      // Attendre que la sauvegarde soit terminée avant de changer d'onglet
      (async () => {
        try {
          await onSaveChanges();
        } finally {
          handleTabChange(tab);
        }
      })();
    } else {
      handleTabChange(tab);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <>
        <div className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex">
              <TabButton
                id="budget"
                label="Budget"
                isActive={activeTab === 'budget'}
                onClick={() => handleSaveBeforeTabChange('budget')}
              />
              {isMainQuote && (
                <>
                  <TabButton
                    id="work"
                    label="Suivi"
                    isActive={activeTab === 'work'}
                    onClick={() => handleSaveBeforeTabChange('work')}
                  />
                  <TabButton
                    id="render"
                    label="Rendu"
                    isActive={activeTab === 'render'}
                    onClick={() => handleSaveBeforeTabChange('render')}
                  />
                </>
              )}
            </div>

            {/* Bouton de réinitialisation du budget de travail */}
            {isWorkBudgetActive && onResetWorkBudget && (
              <div className="pr-4">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
                  title="Réinitialiser le budget de travail"
                >
                  <RotateCcw size={16} />
                  Réinitialiser
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'budget' && (
            <TableComponent
              budget={budget}
              settings={settings}
              notes={notes}
              isWorkBudgetActive={isWorkBudgetActive}
              isEditorMode={isEditorMode}
              onAddItem={onAddItem}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
              onUpdateCategory={onUpdateCategory}
              onUpdateSettings={onUpdateSettings}
              onUpdateNotes={onUpdateNotes}
              onForceEdit={handleForceEdit}
              onSaveChanges={onSaveChanges}
              onToggleEditorMode={onToggleEditorMode}
              onUpdateBudget={onUpdateBudget}
              isDirty={isDirty}
              quoteId={quoteId}
              isForceEditing={isForceEditing}
              project={project}
            />
          )}

          {activeTab === 'work' && (
            <WorkTable
              budget={budget}
              workBudget={workBudget}
              settings={settings}
              onUpdateBudget={onUpdateBudget}
              onAddItem={onAddItem}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
              onUpdateCategory={onUpdateCategory}
              onUpdateSettings={onUpdateSettings}
              onUpdateNotes={onUpdateNotes}
              onForceEdit={handleForceEdit}
              onSaveChanges={onSaveChanges}
              onToggleEditorMode={onToggleEditorMode}
              isDirty={isDirty}
              quoteId={quoteId}
              isForceEditing={isForceEditing}
              onResetWorkBudget={onResetWorkBudget}
              onReorderCategories={handleReorderCategories}
              simpleWorkBudget={simpleWorkBudget}
              setSimpleWorkBudget={setSimpleWorkBudget}
            />
          )}

          {activeTab === 'render' && (
            <RenderTable
              budget={budget}
              additiveQuotes={additiveQuotes}
              additiveQuoteBudgets={additiveQuoteBudgets}
              settings={settings}
              selectedQuote={selectedQuote}
              quoteId={quoteId}
              onSaveChanges={onSaveChanges}
              isDirty={isDirty}
            />
          )}
        </div>
      </>

      {/* Modal de confirmation de réinitialisation */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Réinitialiser le budget de travail ?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Cette action supprimera définitivement toutes les modifications apportées au budget de travail. 
              Le budget initial sera restauré.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Annuler
              </button>
              <button
                onClick={handleResetWorkBudget}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}