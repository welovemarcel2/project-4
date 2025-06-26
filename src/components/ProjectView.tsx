import React, { useState, useEffect } from 'react';
import { Project, Quote, QuoteStatus } from '../types/project';
import { ProjectHeader } from '../layout/ProjectHeader';
import { BudgetTabs } from '../budget/BudgetTabs';
import { CreateQuoteModal } from '../quotes/CreateQuoteModal';
import { QuotesGrid } from '../quotes/QuotesGrid';
import { useBudgetState } from '../hooks/useBudgetState';
import { useQuoteStore } from '../hooks/useQuotes';
import { useQuoteSettings } from '../hooks/useQuoteSettings';
import { BudgetItemType, BudgetLine, BudgetCategory } from '../types/budget';
import { QuoteSettings } from '../types/quoteSettings';
import { HistoryPanel } from '../history/HistoryPanel';
import { useAutoSave } from '../hooks/useAutoSave';

interface ProjectViewProps {
  project: Project;
  quotes: Quote[];
  selectedQuote: Quote | null;
  onBack: () => void;
  onSelectQuote: (quote: Quote) => void;
  onCreateQuote: (data: { 
    name: string; 
    type: 'main' | 'additive'; 
    parentQuoteId?: string; 
    initialBudget?: BudgetCategory[];
    settings?: Partial<QuoteSettings>;
  }) => Promise<Quote | undefined>;
  onUpdateQuoteStatus: (quoteId: string, status: QuoteStatus, details?: { rejectionReason?: string }) => void;
  onUpdateQuoteParent: (quoteId: string, newParentId: string) => void;
  onUpdateSettings: (settings: Partial<QuoteSettings>) => void;
  onDeleteQuote?: (quoteId: string) => void;
}

export function ProjectView({
  project,
  quotes,
  selectedQuote,
  onBack,
  onSelectQuote,
  onCreateQuote,
  onUpdateQuoteStatus,
  onUpdateQuoteParent,
  onUpdateSettings,
  onDeleteQuote: parentDeleteQuote
}: ProjectViewProps) {
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'budget' | 'work' | 'render'>('budget');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  const {
    getBudget,
    getWorkBudget,
    updateBudget,
    addItem,
    updateItem,
    deleteItem,
    updateCategory,
    initializeWorkBudget,
    resetWorkBudget,
    _debugGetBudgetState
  } = useBudgetState();

  const quoteStore = useQuoteStore();
  const { settings, updateSettings } = useQuoteSettings(project.settings);

  // Récupérer le budget actuel
  const currentBudget = selectedQuote ? getBudget(selectedQuote.id) : [];

  // Configurer la sauvegarde automatique
  const { saveChanges, isDirty } = useAutoSave(
    project.id,
    currentBudget,
    async () => {
      if (selectedQuote) {
        await quoteStore.updateQuoteBudget(selectedQuote.id, currentBudget);
        setLastSaveTime(new Date());
      }
    }
  );

  // Debug: Vérifier périodiquement l'état du budget pour s'assurer qu'il est correctement synchronisé
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedQuote) {
        const budgetState = _debugGetBudgetState()[selectedQuote.id];
        console.log('[Debug] Budget state for quote', selectedQuote.id, ':', budgetState);
      }
    }, 30000); // Vérifier toutes les 30 secondes
    
    return () => clearInterval(interval);
  }, [selectedQuote]);

  useEffect(() => {
    if (selectedQuote) {
      console.log(`[ProjectView] Loading data for quote: ${selectedQuote.id}`);
      
      // Charger le budget depuis le store
      const savedBudget = quoteStore.getQuoteBudget(selectedQuote.id);
      const savedWorkBudget = quoteStore.getQuoteWorkBudget(selectedQuote.id);
      
      console.log(`[ProjectView] Saved budget length: ${savedBudget.length} items`);
      console.log(`[ProjectView] Saved work budget length: ${savedWorkBudget.length} items`);

      if (Array.isArray(savedBudget)) {
        updateBudget(selectedQuote.id, savedBudget);
      }

      if (Array.isArray(savedWorkBudget) && savedWorkBudget.length > 0) {
        initializeWorkBudget(selectedQuote.id);
        updateBudget(selectedQuote.id, savedWorkBudget, true);
      }
    }
  }, [selectedQuote?.id]);

  const handleUpdateSettings = (updates: Partial<QuoteSettings>) => {
    const newSettings = { ...settings, ...updates };
    updateSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  const handleCreateQuote = async (data: { 
    name: string; 
    type: 'main' | 'additive'; 
    parentQuoteId?: string; 
    initialBudget?: BudgetCategory[];
    settings?: Partial<QuoteSettings>;
  }) => {
    try {
      const newQuote = await onCreateQuote(data);
      if (newQuote) {
        setIsCreateModalOpen(false);
        return newQuote;
      }
    } catch (error) {
      console.error('Error creating quote:', error);
    }
    return undefined;
  };

  const handleActivateWorkBudget = () => {
    if (selectedQuote) {
      console.log(`[ProjectView] Activating work budget for quote: ${selectedQuote.id}`);
      initializeWorkBudget(selectedQuote.id);
      quoteStore.updateQuoteWorkBudget(selectedQuote.id, getBudget(selectedQuote.id));
      setActiveTab('work');
    }
  };

  const handleResetWorkBudget = () => {
    if (selectedQuote) {
      console.log(`[ProjectView] Resetting work budget for quote: ${selectedQuote.id}`);
      resetWorkBudget(selectedQuote.id);
      quoteStore.updateQuoteWorkBudget(selectedQuote.id, []);
    }
  };

  const handleAddItem = async (
    categoryId: string | null,
    parentId: string | null,
    type: BudgetItemType
  ) => {
    if (selectedQuote) {
      console.log(`[ProjectView] Adding item: categoryId=${categoryId}, parentId=${parentId}, type=${type}`);
      await addItem(selectedQuote.id, categoryId, parentId, type, settings);
      
      // Mettre à jour le budget dans Supabase
      const currentBudget = getBudget(selectedQuote.id);
      if (activeTab === 'work') {
        await quoteStore.updateQuoteWorkBudget(selectedQuote.id, currentBudget);
      } else {
        await quoteStore.updateQuoteBudget(selectedQuote.id, currentBudget);
      }
    }
  };

  const handleUpdateItem = async (
    categoryId: string,
    itemId: string,
    updates: Partial<BudgetLine>,
    saveToBackend = true
  ) => {
    if (selectedQuote) {
      console.log(`[ProjectView] Updating item: categoryId=${categoryId}, itemId=${itemId}`);
      if (updates.name) {
        console.log(`[ProjectView] Updating name to: "${updates.name}"`);
      }
      
      await updateItem(selectedQuote.id, categoryId, itemId, updates, saveToBackend);
      
      // Mettre à jour le budget dans Supabase si demandé
      if (saveToBackend) {
        const currentBudget = getBudget(selectedQuote.id);
        if (activeTab === 'work') {
          await quoteStore.updateQuoteWorkBudget(selectedQuote.id, currentBudget);
        } else {
          await quoteStore.updateQuoteBudget(selectedQuote.id, currentBudget);
        }
        setLastSaveTime(new Date());
      }
    }
  };

  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (selectedQuote) {
      console.log(`[ProjectView] Deleting item: categoryId=${categoryId}, itemId=${itemId}`);
      await deleteItem(selectedQuote.id, categoryId, itemId);
      
      // Mettre à jour le budget dans Supabase
      const currentBudget = getBudget(selectedQuote.id);
      if (activeTab === 'work') {
        await quoteStore.updateQuoteWorkBudget(selectedQuote.id, currentBudget);
      } else {
        await quoteStore.updateQuoteBudget(selectedQuote.id, currentBudget);
      }
    }
  };

  const handleUpdateCategory = async (categoryId: string, updates: Partial<BudgetCategory>) => {
    if (selectedQuote) {
      console.log(`[ProjectView] Updating category: ${categoryId}, updates:`, updates);
      await updateCategory(selectedQuote.id, categoryId, updates);
      
      // Mettre à jour le budget dans Supabase
      const currentBudget = getBudget(selectedQuote.id);
      if (activeTab === 'work') {
        await quoteStore.updateQuoteWorkBudget(selectedQuote.id, currentBudget);
      } else {
        await quoteStore.updateQuoteBudget(selectedQuote.id, currentBudget);
      }
    }
  };

  const handleUpdateBudget = async (newBudget: BudgetCategory[]) => {
    if (selectedQuote) {
      console.log(`[ProjectView] Updating entire budget for quote: ${selectedQuote.id}`);
      await updateBudget(selectedQuote.id, newBudget);
      
      // Mettre à jour le budget dans Supabase
      if (activeTab === 'work') {
        await quoteStore.updateQuoteWorkBudget(selectedQuote.id, newBudget);
      } else {
        await quoteStore.updateQuoteBudget(selectedQuote.id, newBudget);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (selectedQuote) {
      console.log(`[ProjectView] Manually saving changes for quote: ${selectedQuote.id}`);
      const currentBudget = getBudget(selectedQuote.id);
      
      if (activeTab === 'work') {
        await quoteStore.updateQuoteWorkBudget(selectedQuote.id, currentBudget);
      } else {
        await quoteStore.updateQuoteBudget(selectedQuote.id, currentBudget);
      }
      
      await saveChanges();
      setLastSaveTime(new Date());
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      console.log(`[ProjectView] Deleting quote: ${quoteId}`);
      await quoteStore.deleteQuote(quoteId);
      
      // Notifier le parent pour mettre à jour son état
      if (parentDeleteQuote) {
        parentDeleteQuote(quoteId);
      }
      
      // Effacer la sélection si le devis supprimé était sélectionné
      if (selectedQuote?.id === quoteId) {
        onSelectQuote(quotes.find(q => q.id !== quoteId && !q.is_deleted) || quotes[0]);
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  // Récupérer les devis additifs pour le devis principal sélectionné
  const additiveQuotes = selectedQuote?.type === 'main' 
    ? quotes.filter(q => q.type === 'additive' && q.parentQuoteId === selectedQuote.id)
    : [];

  // Récupérer les budgets des devis additifs
  const additiveQuoteBudgets = Object.fromEntries(
    additiveQuotes.map(quote => [quote.id, getBudget(quote.id)])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <ProjectHeader
          project={project}
          quotes={quotes}
          selectedQuote={selectedQuote}
          settings={settings}
          isEditorMode={isEditorMode}
          currentBudget={selectedQuote ? getBudget(selectedQuote.id) : []}
          onUpdateSettings={handleUpdateSettings}
          onToggleEditorMode={() => setIsEditorMode(!isEditorMode)}
          onUpdateBudget={handleUpdateBudget}
          onBack={onBack}
          onSelectQuote={onSelectQuote}
          onCreateQuote={() => setIsCreateModalOpen(true)}
          onSaveChanges={handleSaveChanges}
          isDirty={isDirty}
          lastSavedAt={lastSaveTime}
        />

        {selectedQuote && (
          <HistoryPanel
            projectId={project.id}
            quoteId={selectedQuote.id}
            currentBudget={currentBudget}
            onRestore={handleUpdateBudget}
            onSave={saveChanges}
          />
        )}
      </div>

      {selectedQuote ? (
        <BudgetTabs
          budget={getBudget(selectedQuote.id)}
          workBudget={getWorkBudget(selectedQuote.id)}
          settings={settings}
          selectedQuote={selectedQuote}
          project={project}
          notes={notes}
          isEditorMode={isEditorMode}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onUpdateBudget={handleUpdateBudget}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onUpdateCategory={handleUpdateCategory}
          onUpdateSettings={handleUpdateSettings}
          onUpdateNotes={setNotes}
          onActivateWorkBudget={handleActivateWorkBudget}
          onResetWorkBudget={handleResetWorkBudget}
          onSaveChanges={handleSaveChanges}
          isDirty={isDirty}
          quoteId={selectedQuote.id}
          additiveQuotes={additiveQuotes}
          additiveQuoteBudgets={additiveQuoteBudgets}
          onToggleEditorMode={() => setIsEditorMode(!isEditorMode)}
        />
      ) : (
        <QuotesGrid
          quotes={quotes}
          selectedQuote={selectedQuote}
          budgets={quoteStore.quotesData}
          settings={settings}
          onSelectQuote={onSelectQuote}
          onCreateQuote={() => setIsCreateModalOpen(true)}
          onDeleteQuote={handleDeleteQuote}
          onUpdateQuoteStatus={onUpdateQuoteStatus}
        />
      )}

      <CreateQuoteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateQuote}
        existingQuotes={quotes}
        projectSettings={settings}
      />
    </div>
  );
}