import React, { useState } from 'react';
import { BudgetToolbar } from './BudgetToolbar';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { BudgetCategory, BudgetLine, BudgetItemType } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { Project } from '../../types/project';
import { DraggableCategory } from './DraggableCategory';
import { DraggableSocialChargesCategory } from './DraggableSocialChargesCategory';
import { BudgetSummary } from './BudgetSummary';
import { QuoteNote } from '../notes/QuoteNote';
import { AddCategoryButton } from './AddCategoryButton';
import { AddSubCategoryButton } from './AddSubCategoryButton';
import { RatesGridMenu } from './rates/RatesGridMenu';
import { QuoteSettings as QuoteSettingsModal } from './settings/QuoteSettings';
import { TemplatesMenu } from '../templates/TemplatesMenu';
import { useCurrencyStore } from '../../stores/currencyStore';
import { ExportButton } from './ExportButton';
import { calculateCategoryTotal } from '../../utils/budgetCalculations/base';

interface DraggableBudgetTableProps {
  budget: BudgetCategory[];
  settings: QuoteSettings;
  notes: string;
  onUpdateBudget: (budget: BudgetCategory[]) => void;
  onAddItem: (categoryId: string | null, parentId: string | null, type: BudgetItemType) => void;
  onUpdateCategory: (categoryId: string, updates: Partial<BudgetCategory>) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: Partial<BudgetLine>) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onReorderCategories: (startIndex: number, endIndex: number) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateSettings: (settings: Partial<QuoteSettings>) => void;
  isEditorMode: boolean;
  onToggleEditorMode: () => void;
  quoteId: string;
  project: Project;
}

export function DraggableBudgetTable({
  budget,
  settings,
  notes,
  onUpdateBudget,
  onAddItem,
  onUpdateCategory,
  onUpdateItem,
  onDeleteItem,
  onReorderCategories,
  onUpdateNotes,
  onUpdateSettings,
  isEditorMode,
  onToggleEditorMode,
  quoteId,
  project
}: DraggableBudgetTableProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isRatesGridOpen, setIsRatesGridOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  const { selectedCurrency } = useCurrencyStore();

  // Obtenir les labels des taux personnalisés
  const rate1Label = settings.rateLabels?.rate1Label || 'TX 1';
  const rate2Label = settings.rateLabels?.rate2Label || 'TX 2';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
    // Update all categories' isExpanded state
    const updatedBudget = budget.map(category => ({
      ...category,
      isExpanded: !isExpanded,
      items: category.items.map(item => ({
        ...item,
        isExpanded: !isExpanded,
        subItems: item.subItems?.map(subItem => ({
          ...subItem,
          isExpanded: !isExpanded
        }))
      }))
    }));
    onUpdateBudget(updatedBudget);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = budget.findIndex(cat => cat.id === active.id);
      const newIndex = budget.findIndex(cat => cat.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderCategories(oldIndex, newIndex);
      }
    }
  };

  // Filtrer les catégories pour le drag & drop
  const sortableCategories = settings.socialChargesDisplay === 'grouped' 
    ? budget 
    : budget.filter(cat => cat.id !== 'social-charges');

  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-4 items-start">
        {/* Colonne 1/4 : Catégories */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Catégories</h3>
            <ul className="space-y-1">
              {budget.map((cat) => (
                <li key={cat.id} className="flex items-center justify-between text-sm">
                  <span>{cat.name}</span>
                  <span className="font-medium ml-2">{cat.items && cat.items.length > 0 ? `${calculateCategoryTotal(cat, settings).toLocaleString('fr-FR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} €` : '-'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* Colonne 2/4 : Résumé + Export */}
        <div className="col-span-1 flex flex-col gap-4">
          <BudgetSummary categories={budget} settings={settings} notes={notes} quoteId={quoteId} project={project} />
          <ExportButton className="w-full" />
        </div>
        {/* Colonnes 3-4/4 : Notes */}
        <div className="col-span-2">
          <QuoteNote onChange={onUpdateNotes} />
        </div>
      </div>
      <div className="space-y-4">
        <BudgetToolbar
          isEditorMode={isEditorMode}
          showEmptyItems={settings.showEmptyItems}
          isExpanded={isExpanded}
          onToggleEmptyItems={(show) => onUpdateSettings({ showEmptyItems: show })}
          onToggleExpand={handleToggleExpand}
          onOpenRatesGrid={() => setIsRatesGridOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenTemplates={() => setIsTemplatesOpen(true)}
          onToggleEditorMode={onToggleEditorMode}
        />
        
        <div className="border rounded-lg bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="w-10"></th>
                    <th className="text-left px-1.5 py-1.5 min-w-[300px] text-xs font-medium text-gray-600 sticky left-0 bg-gray-50">
                      Ligne de coût
                    </th>
                    <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Qté</th>
                    <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">Nb</th>
                    <th className="text-center px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Unité</th>
                    <th className="text-right px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Tarif</th>
                    <th className="text-right px-1.5 py-1.5 w-20 text-xs font-medium text-gray-600">Total</th>
                    <th className="text-center px-1.5 py-1.5 w-8 text-xs font-medium text-gray-600">H.S.</th>
                    <th className="text-center px-1.5 py-1.5 w-8 text-xs font-medium text-gray-600">€</th>
                    <th className="text-center px-1.5 py-1.5 w-16 text-xs font-medium text-gray-600">Ch. Soc.</th>
                    <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">{rate1Label}</th>
                    <th className="text-center px-1.5 py-1.5 w-14 text-xs font-medium text-gray-600">{rate2Label}</th>
                    <th className="text-center px-1.5 py-1.5 w-24 text-xs font-medium text-gray-600">Répartition</th>
                  </tr>
                </thead>
                <tbody>
                  <SortableContext
                    items={sortableCategories.map(cat => cat.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortableCategories.map((category, index) => (
                      <React.Fragment key={category.id}>
                        {category.id === 'social-charges' ? (
                          <DraggableSocialChargesCategory
                            budget={budget.filter(cat => cat.id !== 'social-charges')}
                            settings={settings}
                          />
                        ) : (
                          <>
                            <DraggableCategory
                              category={category}
                              index={index}
                              settings={settings}
                              onUpdateCategory={(updates) => onUpdateCategory(category.id, updates)}
                              onUpdateItem={(itemId, updates) => onUpdateItem(category.id, itemId, updates)}
                              onDeleteItem={(itemId) => onDeleteItem(category.id, itemId)}
                              onAddItem={(parentId, type) => onAddItem(category.id, parentId, type)}
                              quoteId={quoteId}
                              categories={budget}
                              selectedCurrency={selectedCurrency}
                            />
                            {category.isExpanded && (
                              <tr>
                                <td colSpan={13} className="px-0 py-0">
                                  <AddSubCategoryButton
                                    onClick={() => onAddItem(category.id, null, 'subCategory')}
                                    level={1}
                                  />
                                </td>
                              </tr>
                            )}
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </SortableContext>
                  <tr>
                    <td colSpan={13} className="px-0 py-0">
                      <AddCategoryButton
                        onClick={() => onAddItem(null, null, 'category')}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </DndContext>
          </div>
        </div>

        {isRatesGridOpen && (
          <RatesGridMenu
            isOpen={isRatesGridOpen}
            onClose={() => setIsRatesGridOpen(false)}
            currentBudget={budget}
            onUpdateBudget={onUpdateBudget}
          />
        )}

        {isSettingsOpen && (
          <QuoteSettingsModal
            isOpen={isSettingsOpen}
            settings={settings}
            budget={budget}
            onUpdateSettings={onUpdateSettings}
            onUpdateBudget={onUpdateBudget}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}

        {isTemplatesOpen && (
          <TemplatesMenu
            isOpen={isTemplatesOpen}
            onClose={() => setIsTemplatesOpen(false)}
            currentBudget={budget}
            onApplyTemplate={onUpdateBudget}
            settings={settings}
          />
        )}
      </div>
    </>
  );
}