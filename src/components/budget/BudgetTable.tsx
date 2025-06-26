import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { BudgetCategory, BudgetLine, BudgetItemType } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { Project } from '../../types/project';
import { BudgetRow } from './BudgetRow';
import { SocialChargesCategory } from './SocialChargesCategory';
import { SubCategorySocialCharges } from './SubCategorySocialCharges';
import { CategoryTotal } from './CategoryTotal';
import { BudgetSummary } from './BudgetSummary';
import { QuoteNote } from '../notes/QuoteNote';
import { AddCategoryButton } from './AddCategoryButton';
import { AddSubCategoryButton } from './AddSubCategoryButton';
import { AddPostButton } from './AddPostButton';
import { formatNumber } from '../../utils/formatNumber';
import { calculateLineTotal, calculateSocialCharges } from '../../utils/budgetCalculations/base';
import { useExpenseCategoriesStore } from '../../stores/expenseCategoriesStore';
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { BudgetToolbar } from './BudgetToolbar';
import { RatesGridMenu } from './rates/RatesGridMenu';
import { QuoteSettings as QuoteSettingsModal } from './settings/QuoteSettings';
import { formatItemNumber } from '../../utils/formatItemNumber';
import { TemplatesMenu } from '../templates/TemplatesMenu';
import { CurrencyDisplay } from './CurrencyDisplay';
import { useCurrencyStore } from '../../stores/currencyStore';
import { BudgetTableHeader } from './parts/BudgetTableHeader';
import { BudgetCategoryRow } from './parts/BudgetCategoryRow';
import { getBaseStructureKey } from '../../utils/budget/percentageBase';
import Papa from 'papaparse';

interface BudgetTableProps {
  budget: BudgetCategory[];
  settings: QuoteSettings;
  notes: string;
  isWorkBudgetActive?: boolean;
  isEditorMode: boolean;
  onAddItem: (categoryId: string | null, parentId: string | null, type: BudgetItemType) => void;
  onUpdateItem: (categoryId: string, itemId: string, updates: Partial<BudgetLine>, saveToBackend?: boolean) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onUpdateCategory: (categoryId: string, updates: Partial<BudgetCategory>) => void;
  onUpdateSettings: (updates: Partial<QuoteSettings>) => void;
  onUpdateNotes: (notes: string) => void;
  onForceEdit?: () => void;
  onSaveChanges?: () => void;
  onToggleEditorMode: () => void;
  onUpdateBudget: (budget: BudgetCategory[]) => void;
  isDirty?: boolean;
  quoteId: string;
  isForceEditing?: boolean;
  project: Project;
}

// Fonction utilitaire pour savoir s'il y a au moins une répartition dans tout le budget
function hasAnyDistribution(categories: BudgetCategory[]): boolean {
  function checkItems(items: BudgetLine[]): boolean {
    for (const item of items) {
      if (item.distributions && item.distributions.length > 0) return true;
      if (item.subItems && checkItems(item.subItems)) return true;
    }
    return false;
  }
  return categories.some(cat => checkItems(cat.items));
}

export function BudgetTable({
  budget,
  settings,
  notes,
  isWorkBudgetActive = false,
  isEditorMode,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onUpdateCategory,
  onUpdateSettings,
  onUpdateNotes,
  onForceEdit,
  onSaveChanges,
  onToggleEditorMode,
  onUpdateBudget,
  isDirty,
  quoteId,
  isForceEditing = false,
  project
}: BudgetTableProps) {
  const { showExpenseDistribution, getCategories } = useExpenseCategoriesStore();
  const expenseCategories = getCategories(quoteId);
  const { selectedCurrency } = useCurrencyStore();
  
  const [isRatesGridOpen, setIsRatesGridOpen] = useState(false);
  const [isRatesGridBrowseOpen, setIsRatesGridBrowseOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [importingPost, setImportingPost] = useState<{ categoryId: string, itemId: string, onSelect: (poste: any) => void } | null>(null);

  // DEBUG : compteur de re-render et hash
  const [renderCount, setRenderCount] = useState(0);
  useEffect(() => { setRenderCount(c => c + 1); }, [budget]);
  const budgetHash = useMemo(() => {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(budget)))).slice(0, 16);
    } catch {
      return Math.random().toString(36).slice(2, 10);
    }
  }, [budget]);

  const handleForceEdit = useCallback(() => {
    if (onForceEdit) {
      onForceEdit();
    }
  }, [onForceEdit]);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
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
  }, [isExpanded, budget, onUpdateBudget]);

  // Ensure budget is always an array
  const budgetArray = useMemo(() => Array.isArray(budget) ? budget : [], [budget]);

  // Génère une clé unique pour forcer le re-render global du tableau à chaque changement du budget
  const budgetKey = useMemo(() => {
    try {
      return 'budget-' + btoa(unescape(encodeURIComponent(JSON.stringify(budget)))).slice(0, 32);
    } catch {
      return 'budget-' + Math.random();
    }
  }, [budget]);

  // Get rate labels
  const rate1Label = settings.rateLabels?.rate1Label || 'Frais généraux';
  const rate2Label = settings.rateLabels?.rate2Label || 'Marge';

  // Add social charges category if needed
  const budgetWithSocialCharges = useMemo(() => {
    if (settings.socialChargesDisplay === 'grouped') {
      return budgetArray;
    }
    
    // Filter out social charges category if it exists
    return budgetArray.filter(cat => cat.id !== 'social-charges');
  }, [budgetArray, settings.socialChargesDisplay]);

  const handleUpdateItem = useCallback((categoryId: string, itemId: string, updates: Partial<BudgetLine>) => {
    onUpdateItem(categoryId, itemId, updates);
  }, [onUpdateItem]);

  const renderItems = useCallback((items: BudgetLine[], categoryId: string, parentNumbers: string[] = []): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    items.forEach((item, index) => {
      const currentNumbers = [...parentNumbers, (index + 1).toString()];
      
      result.push(
        (() => {
          let extraKey = '';
          if (item.unit === '%' && item.selectedCategories) {
            extraKey = getBaseStructureKey(item.selectedCategories, budgetArray);
          }
          return (
            <BudgetRow
              key={item.id + '-' + extraKey}
              item={item}
              parentNumbers={parentNumbers}
              settings={settings}
              categories={budgetArray}
              onUpdate={(updates) => handleUpdateItem(categoryId, item.id, updates)}
              onDelete={() => onDeleteItem(categoryId, item.id)}
              disabled={isWorkBudgetActive && !isForceEditing}
              isWorkBudget={false}
              quoteId={quoteId}
              selectedCurrency={selectedCurrency}
              onOpenRatesGrid={(onSelect) => {
                setImportingPost({ categoryId, itemId: item.id, onSelect });
                setIsRatesGridOpen(true);
              }}
            />
          );
        })()
      );

      if (item.isExpanded) {
        if (item.subItems && item.subItems.length > 0) {
          result.push(...renderItems(item.subItems, categoryId, currentNumbers));
        }

        if (item.type === 'subCategory') {
          if (settings.socialChargesDisplay === 'detailed') {
            result.push(
              <SubCategorySocialCharges
                key={`${item.id}-charges`}
                subCategory={item}
                settings={settings}
                level={parentNumbers.length}
                onUpdateItem={(updates) => handleUpdateItem(categoryId, item.id, updates)}
                quoteId={quoteId}
              />
            );
          }

          result.push(
            <tr key={`${item.id}-add-post`}>
              <td colSpan={13 + (showExpenseDistribution ? expenseCategories.length : 0)} className="px-0 py-0">
                <AddPostButton
                  onClick={() => onAddItem(categoryId, item.id, 'post')}
                  level={currentNumbers.length}
                  disabled={isWorkBudgetActive && !isForceEditing}
                />
              </td>
            </tr>
          );
        }
      }
    });

    return result;
  }, [budget, settings, isWorkBudgetActive, isForceEditing, onAddItem, handleUpdateItem, onDeleteItem, quoteId, showExpenseDistribution, expenseCategories.length, selectedCurrency]);

  const showAnyDistribution = showExpenseDistribution && hasAnyDistribution(budgetArray);

  useEffect(() => {
    // Synchronisation des noms de postes lors du changement de langue
    let isMounted = true;
    async function syncBudgetLang() {
      if (!settings.budgetLang) return;
      // Charger le CSV
      const response = await fetch('/GRILLE_TARIFAIRE.csv');
      const csvText = await response.text();
      const results = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const csvRows = results.data as any[];
      // Indexer par ref
      const refMap = new Map<string, any>();
      for (const row of csvRows) {
        const key = (row['Name FR'] || '') + '|' + (row['Name EN'] || '');
        refMap.set(key, row);
      }
      // Fonction récursive pour mettre à jour les noms
      function updateItems(items: any[]): any[] {
        return items.map((item: any) => {
          let updated = { ...item };
          if (item.tarifRef) {
            const key = (item.tarifRef.nameFr || '') + '|' + (item.tarifRef.nameEn || '');
            const csvRow = refMap.get(key);
            if (csvRow) {
              const newName = settings.budgetLang === 'en' ? csvRow['Name EN'] : csvRow['Name FR'];
              if (newName && newName !== item.name) {
                updated.name = newName;
              }
            }
          }
          if (item.subItems && item.subItems.length > 0) {
            updated.subItems = updateItems(item.subItems);
          }
          return updated;
        });
      }
      // Parcourir le budget et mettre à jour les noms récursivement
      const newBudget = budget.map(category => ({
        ...category,
        items: updateItems(category.items)
      }));
      if (isMounted) onUpdateBudget(newBudget);
    }
    syncBudgetLang();
    return () => { isMounted = false; };
  }, [settings.budgetLang]);

  return (
    <div className="space-y-4" key={budgetKey}>
      {/* DEBUG : compteur de re-render et hash */}
      <div style={{ fontSize: 12, color: '#b91c1c', background: '#fef2f2', borderRadius: 3, padding: 4, marginBottom: 4, maxWidth: 350 }}>
        <b>BudgetTable re-render :</b> {renderCount} | <b>Hash :</b> {budgetHash}
      </div>
      <BudgetSummary 
        categories={budget} 
        settings={settings} 
        notes={notes}
        quoteId={quoteId}
        project={project}
      />
      
      {isWorkBudgetActive && !isForceEditing && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <div className="flex items-center gap-3 text-amber-800">
            <AlertTriangle size={20} className="text-amber-500" />
            <p className="text-sm">
              Vous avez commencé à éditer le budget de suivi. Vous ne pouvez plus modifier le budget initial.
            </p>
          </div>
          <button
            onClick={handleForceEdit}
            className="px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-100 rounded-md"
          >
            Modifier quand même
          </button>
        </div>
      )}
      
      <QuoteNote onChange={onUpdateNotes} />
      
      <BudgetToolbar
        isEditorMode={isEditorMode}
        showEmptyItems={settings.showEmptyItems}
        isExpanded={isExpanded}
        onToggleEmptyItems={(show) => onUpdateSettings({ showEmptyItems: show })}
        onToggleExpand={handleToggleExpand}
        onOpenRatesGrid={() => setIsRatesGridBrowseOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onToggleEditorMode={onToggleEditorMode}
      />
      
      <div className="border rounded-lg bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="w-6"></th>
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
                {showAnyDistribution && expenseCategories.map(category => (
                  <th 
                    key={category.id} 
                    className="text-right px-1.5 py-1.5 w-24 text-xs font-medium text-gray-600"
                    style={{ borderLeft: `2px solid ${category.color}` }}
                  >
                    {category.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {budgetWithSocialCharges.map((category, index) => {
                // Format category number based on settings
                const categoryNumber = settings.numbering 
                  ? formatItemNumber(
                      [index + 1],
                      [settings.numbering.category],
                      settings.numbering.separator
                    )
                  : (index + 1).toString();

                return (
                  <React.Fragment key={category.id}>
                    {category.id === 'social-charges' ? (
                      <SocialChargesCategory
                        budget={budgetWithSocialCharges.filter(cat => cat.id !== 'social-charges')}
                        settings={settings}
                        workBudget={[]}
                        categoryIndex={index}
                        isExpanded={true}
                        onToggleExpand={() => {}}
                        onUpdateSocialCharges={(rateId, updates) => {
                          const newSettings = {
                            ...settings,
                            socialChargeRates: settings.socialChargeRates.map(rate =>
                              rate.id === rateId
                                ? { ...rate, ...updates }
                                : rate
                            )
                          };
                          onUpdateSettings(newSettings);
                        }}
                        quoteId={quoteId}
                      />
                    ) : (
                      <>
                        <tr className="group bg-blue-800 h-8 border-b border-blue-700 w-full">
                          <td className="w-6 px-1 bg-blue-800">
                            <button 
                              onClick={() => onUpdateCategory(category.id, { isExpanded: !category.isExpanded })}
                              className="p-0.5 hover:bg-blue-700 rounded transition-colors"
                            >
                              {category.isExpanded ? (
                                <ChevronDown size={14} className="text-white" />
                              ) : (
                                <ChevronRight size={14} className="text-white" />
                              )}
                            </button>
                          </td>
                          <td className="px-2 py-1 bg-blue-800">
                            <div className="flex items-center">
                              <span className="text-[10px] text-gray-300 font-mono tracking-tighter mr-1.5">
                                {categoryNumber}
                              </span>
                              <input
                                type="text"
                                value={category.name}
                                onChange={(e) => onUpdateCategory(category.id, { name: e.target.value })}
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-white/30 rounded px-0.5 text-xs font-bold uppercase tracking-wide text-white"
                                disabled={isWorkBudgetActive && !isForceEditing}
                              />
                            </div>
                          </td>
                          <td colSpan={4} className="bg-blue-800"></td>
                          <td className="text-right px-2 py-1 bg-blue-800">
                            <CategoryTotal
                              items={category.items}
                              settings={settings}
                              selectedCurrency={selectedCurrency}
                              convertAmount={useCurrencyStore.getState().convertAmount}
                            />
                          </td>
                          <td colSpan={5} className="bg-blue-800"></td>
                          <td className="bg-blue-800"></td>
                          {showAnyDistribution && expenseCategories.map(expenseCategory => {
                            // Calculer le total pour cette catégorie de dépense
                            const categoryTotal = category.items.reduce((total, item) => {
                              // Fonction récursive pour calculer les distributions
                              const calculateDistributedAmount = (item: BudgetLine): number => {
                                const distribution = item.distributions?.find(d => d.id === expenseCategory.id);
                                if (!distribution) return 0;
                                
                                const baseAmount = calculateLineTotal(item, settings);
                                let distributedAmount = 0;
                                
                                if (distribution.type === 'percentage') {
                                  distributedAmount = baseAmount * (distribution.amount / 100);
                                } else { // fixed
                                  distributedAmount = distribution.amount;
                                }
                                
                                // Ajouter les charges sociales si nécessaire
                                if (item.socialCharges && item.includeSocialChargesInDistribution) {
                                  const socialCharges = calculateSocialCharges(item, settings);
                                  if (distribution.type === 'percentage') {
                                    distributedAmount += socialCharges * (distribution.amount / 100);
                                  } else {
                                    // Pour les montants fixes, on ajoute proportionnellement
                                    const ratio = distribution.amount / baseAmount;
                                    distributedAmount += socialCharges * ratio;
                                  }
                                }
                                
                                // Ajouter les sous-items
                                if (item.subItems) {
                                  distributedAmount += item.subItems.reduce((sum, subItem) => 
                                    sum + calculateDistributedAmount(subItem), 0);
                                }
                                
                                return distributedAmount;
                              };
                              
                              return total + calculateDistributedAmount(item);
                            }, 0);
                            
                            return (
                              <td 
                                key={expenseCategory.id} 
                                className="text-right px-2 py-1 bg-blue-800"
                                style={{ borderLeft: `2px solid ${expenseCategory.color}` }}
                              >
                                {categoryTotal > 0 && (
                                  <span className="text-xs font-bold uppercase tracking-wide text-white">
                                    {formatNumber(categoryTotal)}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        {category.isExpanded && (
                          <>
                            {renderItems(category.items, category.id, [categoryNumber])}
                            <tr>
                              <td colSpan={13 + (showAnyDistribution ? expenseCategories.length : 0)} className="px-0 py-0">
                                <AddSubCategoryButton
                                  onClick={() => onAddItem(category.id, null, 'subCategory')}
                                  level={1}
                                  disabled={isWorkBudgetActive && !isForceEditing}
                                />
                              </td>
                            </tr>
                          </>
                        )}
                      </>
                    )}
                  </React.Fragment>
                );
              })}
              <tr>
                <td colSpan={13 + (showAnyDistribution ? expenseCategories.length : 0)} className="px-0 py-0">
                  <AddCategoryButton
                    onClick={() => onAddItem(null, null, 'category')}
                    disabled={isWorkBudgetActive && !isForceEditing}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {isRatesGridOpen && importingPost && (
        <RatesGridMenu
          isOpen={isRatesGridOpen}
          onClose={() => {
            setIsRatesGridOpen(false);
            setImportingPost(null);
          }}
          budgetLang={settings.budgetLang || 'fr'}
          isEditMode={isEditorMode}
          onAddToBudget={(poste) => {
            importingPost.onSelect(poste);
            setIsRatesGridOpen(false);
            setImportingPost(null);
          }}
        />
      )}

      {isRatesGridBrowseOpen && (
        <RatesGridMenu
          isOpen={isRatesGridBrowseOpen}
          onClose={() => setIsRatesGridBrowseOpen(false)}
          budgetLang={settings.budgetLang || 'fr'}
          isEditMode={false}
          onAddToBudget={() => {}}
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

      {/* Bouton de sauvegarde flottant si des modifications sont en attente */}
      {isDirty && onSaveChanges && (
        <div className="fixed bottom-4 right-4 z-10">
          <button
            onClick={onSaveChanges}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Enregistrer les modifications
          </button>
        </div>
      )}
    </div>
  );
}