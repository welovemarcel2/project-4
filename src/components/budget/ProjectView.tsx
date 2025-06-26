import React, { useState, useEffect } from 'react';
import { Project, Quote, QuoteStatus } from '../../types/project';
import { ProjectHeader } from '../layout/ProjectHeader';
import { BudgetTabs } from '../budget/BudgetTabs';
import { CreateQuoteModal } from '../quotes/CreateQuoteModal';
import { QuotesGrid } from '../quotes/QuotesGrid';
import { useBudgetState } from '../../hooks/useBudgetState';
import { useQuoteStore } from '../../hooks/useQuotes';
import { useQuoteSettings } from '../../hooks/useQuoteSettings';
import { BudgetItemType, BudgetLine, BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { HistoryPanel } from '../history/HistoryPanel';
import { useAutoSave } from '../../hooks/useAutoSave';

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
  }) => Promise<Quote>;
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isForceEditing, setIsForceEditing] = useState(false);
  const [workBudgetVersion, setWorkBudgetVersion] = useState(0);
  
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
    loadWorkBudget,
    addWorkItem,
    updateWorkItem,
    deleteWorkItem,
    updateWorkCategory
  } = useBudgetState();

  const quoteStore = useQuoteStore();
  const { settings, updateSettings } = useQuoteSettings(project.settings);

  // Get current budget
  const currentBudget = selectedQuote ? getBudget(selectedQuote.id) : [];
  const currentWorkBudget = selectedQuote ? getWorkBudget(selectedQuote.id) : [];

  // Configure auto-save for main budget
  const { saveChanges: saveMainBudget, isDirty: isMainBudgetDirty } = useAutoSave(
    project.id,
    currentBudget,
    async () => {
      if (selectedQuote) {
        await quoteStore.updateQuoteBudget(selectedQuote.id, currentBudget);
      }
    }
  );

  // Configure auto-save for work budget
  const { saveChanges: saveWorkBudget, isDirty: isWorkBudgetDirty } = useAutoSave(
    `${project.id}-work`,
    currentWorkBudget,
    async () => {
      if (selectedQuote) {
        await quoteStore.updateQuoteWorkBudget(selectedQuote.id, currentWorkBudget);
      }
    }
  );

  // Determine which save function to use based on active tab
  const saveChanges = activeTab === 'work' ? saveWorkBudget : saveMainBudget;
  const isDirty = activeTab === 'work' ? isWorkBudgetDirty : isMainBudgetDirty;

  useEffect(() => {
    if (selectedQuote) {
      const savedBudget = quoteStore.getQuoteBudget(selectedQuote.id);
      
      if (Array.isArray(savedBudget)) {
        updateBudget(selectedQuote.id, savedBudget);
      }

      // Load work budget if it exists
      loadWorkBudget(selectedQuote.id);
    }
  }, [selectedQuote?.id]);

  // Forcer l'initialisation du workBudget quand on passe à l'onglet work
  useEffect(() => {
    if (activeTab === 'work' && selectedQuote) {
      console.log('Effect: Switching to work tab, initializing workBudget');
      initializeWorkBudget(selectedQuote.id);
      setWorkBudgetVersion(prev => prev + 1);
    }
  }, [activeTab, selectedQuote?.id]);

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
      setIsCreateModalOpen(false);
      return newQuote;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  };

  const handleActivateWorkBudget = () => {
    if (selectedQuote) {
      console.log('handleActivateWorkBudget: just switching to work tab');
      setActiveTab('work');
    }
  };

  const handleResetWorkBudget = () => {
    if (selectedQuote) {
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
      if (activeTab === 'work') {
        if (type === 'category' || categoryId) {
          addWorkItem(selectedQuote.id, categoryId || '', parentId || '', type, settings);
          setWorkBudgetVersion(prev => prev + 1);
        }
      } else {
        addItem(selectedQuote.id, categoryId, parentId, type, settings, false);
        const updatedBudget = getBudget(selectedQuote.id);
        await quoteStore.updateQuoteBudget(selectedQuote.id, updatedBudget);
      }
    }
  };

  const handleUpdateItem = async (
    categoryId: string,
    itemId: string,
    updates: Partial<BudgetLine>,
    saveToBackend = false
  ) => {
    if (selectedQuote) {
      if (activeTab === 'work') {
        updateWorkItem(selectedQuote.id, categoryId, itemId, updates);
      } else {
        await updateItem(selectedQuote.id, categoryId, itemId, updates, false);
        if (saveToBackend) {
          const updatedBudget = getBudget(selectedQuote.id);
          await quoteStore.updateQuoteBudget(selectedQuote.id, updatedBudget);
        }
      }
    }
  };

  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (selectedQuote) {
      if (activeTab === 'work') {
        deleteWorkItem(selectedQuote.id, categoryId, itemId);
      } else {
        deleteItem(selectedQuote.id, categoryId, itemId, false);
        const updatedBudget = getBudget(selectedQuote.id);
        await quoteStore.updateQuoteBudget(selectedQuote.id, updatedBudget);
      }
    }
  };

  const handleUpdateCategory = async (categoryId: string, updates: Partial<BudgetCategory>) => {
    if (selectedQuote) {
      if (activeTab === 'work') {
        updateWorkCategory(selectedQuote.id, categoryId, updates);
      } else {
        updateCategory(selectedQuote.id, categoryId, updates, false);
        const updatedBudget = getBudget(selectedQuote.id);
        await quoteStore.updateQuoteBudget(selectedQuote.id, updatedBudget);
      }
    }
  };

  const handleUpdateBudget = async (newBudget: BudgetCategory[]) => {
    if (selectedQuote) {
      const isWorkTab = activeTab === 'work';
      updateBudget(selectedQuote.id, newBudget, isWorkTab);
      
      if (isWorkTab) {
        await quoteStore.updateQuoteWorkBudget(selectedQuote.id, newBudget);
      } else {
        await quoteStore.updateQuoteBudget(selectedQuote.id, newBudget);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (selectedQuote) {
      const isWorkTab = activeTab === 'work';
      const currentBudget = isWorkTab 
        ? getWorkBudget(selectedQuote.id) 
        : getBudget(selectedQuote.id);
      
      if (isWorkTab) {
        await quoteStore.updateQuoteWorkBudget(selectedQuote.id, currentBudget);
        await saveWorkBudget();
      } else {
        await quoteStore.updateQuoteBudget(selectedQuote.id, currentBudget);
        await saveMainBudget();
      }
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      await quoteStore.deleteQuote(quoteId);
      
      // Notify parent to update its state
      if (parentDeleteQuote) {
        parentDeleteQuote(quoteId);
      }
      
      // Clear selection if deleted quote was selected
      if (selectedQuote?.id === quoteId) {
        onSelectQuote(quotes.find(q => q.id !== quoteId && !q.is_deleted) || quotes[0]);
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const handleForceEdit = () => {
    setIsForceEditing(true);
  };

  // Get additive quotes for the selected main quote
  const additiveQuotes = selectedQuote?.type === 'main' 
    ? quotes.filter(q => q.type === 'additive' && q.parentQuoteId === selectedQuote.id)
    : [];

  // Get budgets for additive quotes
  const additiveQuoteBudgets = Object.fromEntries(
    additiveQuotes.map(quote => [quote.id, getBudget(quote.id)])
  );

  const handleAddWorkItem = (
    categoryId: string | null,
    parentId: string | null,
    type: BudgetItemType
  ) => {
    if (selectedQuote) {
      addWorkItem(selectedQuote.id, categoryId || '', parentId || '', type, settings);
      setWorkBudgetVersion(prev => prev + 1);
    }
  };

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
        />

        {selectedQuote && (
          <HistoryPanel
            projectId={project.id}
            quoteId={selectedQuote.id}
            currentBudget={activeTab === 'work' ? currentWorkBudget : currentBudget}
            onRestore={handleUpdateBudget}
            onSave={async () => {
              const result = await saveChanges();
              return result;
            }}
          />
        )}
      </div>

      {selectedQuote ? (
        <BudgetTabs
          budget={currentBudget}
          workBudget={currentWorkBudget}
          settings={settings}
          selectedQuote={selectedQuote}
          notes={notes}
          isEditorMode={isEditorMode}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onUpdateBudget={handleUpdateBudget}
          onAddItem={activeTab === 'work' ? handleAddWorkItem : handleAddItem}
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