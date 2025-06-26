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
  }) => void;
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
  
  const {
    getBudget,
    getWorkBudget,
    updateBudget,
    addItem,
    updateItem,
    deleteItem,
    updateCategory,
    initializeWorkBudget,
    resetWorkBudget
  } = useBudgetState();

  const quoteStore = useQuoteStore();
  const { settings, updateSettings } = useQuoteSettings(project.settings);

  // Get current budget
  const currentBudget = selectedQuote ? getBudget(selectedQuote.id) : [];

  // Configure auto-save
  const { saveChanges } = useAutoSave(
    project.id,
    currentBudget,
    async () => {
      if (selectedQuote) {
        await quoteStore.updateQuoteBudget(selectedQuote.id, currentBudget);
      }
    }
  );

  useEffect(() => {
    if (selectedQuote) {
      const savedBudget = quoteStore.getQuoteBudget(selectedQuote.id);
      const savedWorkBudget = quoteStore.getQuoteWorkBudget(selectedQuote.id);

      if (Array.isArray(savedBudget)) {
        updateBudget(selectedQuote.id, savedBudget);
      }

      if (Array.isArray(savedWorkBudget) && savedWorkBudget.length > 0) {
        initializeWorkBudget(selectedQuote.id);
        updateBudget(selectedQuote.id, savedWorkBudget);
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
      await onCreateQuote(data);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating quote:', error);
    }
  };

  const handleActivateWorkBudget = () => {
    if (selectedQuote) {
      initializeWorkBudget(selectedQuote.id);
      quoteStore.updateQuoteWorkBudget(selectedQuote.id, getBudget(selectedQuote.id));
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
      addItem(selectedQuote.id, categoryId, parentId, type, settings);
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
    saveToBackend = false
  ) => {
    if (selectedQuote) {
      await updateItem(selectedQuote.id, categoryId, itemId, updates, saveToBackend);
      const currentBudget = getBudget(selectedQuote.id);
      if (activeTab === 'work') {
        await quoteStore.updateQuoteWorkBudget(selectedQuote.id, currentBudget);
      } else if (saveToBackend) {
        await quoteStore.updateQuoteBudget(selectedQuote.id, currentBudget);
      }
    }
  };

  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (selectedQuote) {
      deleteItem(selectedQuote.id, categoryId, itemId);
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
      updateCategory(selectedQuote.id, categoryId, updates);
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
      updateBudget(selectedQuote.id, newBudget);
      if (activeTab === 'work') {
        await quoteStore.updateQuoteWorkBudget(selectedQuote.id, newBudget);
      } else {
        await quoteStore.updateQuoteBudget(selectedQuote.id, newBudget);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (selectedQuote) {
      const currentBudget = getBudget(selectedQuote.id);
      if (activeTab === 'work') {
        await quoteStore.updateQuoteWorkBudget(selectedQuote.id, currentBudget);
      } else {
        await quoteStore.updateQuoteBudget(selectedQuote.id, currentBudget);
      }
      await saveChanges();
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

  // Get additive quotes for the selected main quote
  const additiveQuotes = selectedQuote?.type === 'main' 
    ? quotes.filter(q => q.type === 'additive' && q.parentQuoteId === selectedQuote.id)
    : [];

  // Get budgets for additive quotes
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
          isDirty={history?.isDirty}
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