import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { BudgetCategory, BudgetLine } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { formatNumber } from '../../utils/formatNumber';
import { calculateLineTotal, calculateSocialCharges } from '../../utils/budgetCalculations/base';
import { useExpenseCategoriesStore } from '../../stores/expenseCategoriesStore';
import { getBaseStructureKey } from '../../utils/budget/percentageBase';

interface CategorySelectorProps {
  quoteId: string;
  categories: BudgetCategory[];
  selectedCategories?: string[];
  currentItemId?: string;
  currentNumber?: number;
  onUpdateItem: (updates: Partial<BudgetLine>) => void;
  settings: QuoteSettings;
  includeSocialCharges?: boolean;
  onIncludeSocialChargesChange?: (include: boolean) => void;
  onSelect: (selectedIds: string[]) => void;
  onClose: () => void;
}

interface CategoryItemProps {
  item: BudgetLine;
  level: number;
  isSelected: boolean;
  onToggle: (id: string) => void;
  selectedIds: Set<string>;
  setSelectedIds: (ids: Set<string>) => void;
  parentChain: string[];
}

function isParentSelected(item: BudgetLine, selectedIds: Set<string>, parentChain: string[]): boolean {
  return parentChain.some(parentId => selectedIds.has(parentId));
}

function CategoryItem({ item, level, isSelected, onToggle, selectedIds, setSelectedIds, parentChain }: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const indentation = level * 20;

  const areAllSubItemsSelected = hasSubItems && item.subItems.every(
    subItem => selectedIds.has(subItem.id)
  );

  const areSomeSubItemsSelected = hasSubItems && item.subItems.some(
    subItem => selectedIds.has(subItem.id)
  );

  const parentSelected = isParentSelected(item, selectedIds, parentChain);

  const handleToggle = () => {
    const newSelectedIds = new Set(selectedIds);
    const shouldSelect = !isSelected;

    // Sélectionner/désélectionner l'élément actuel
    if (shouldSelect) {
      newSelectedIds.add(item.id);
    } else {
      newSelectedIds.delete(item.id);
    }

    // Si c'est une sous-catégorie, sélectionner/désélectionner tous ses postes
    if (item.type === 'subCategory' && item.subItems) {
      item.subItems.forEach(post => {
        if (shouldSelect) {
          newSelectedIds.add(post.id);
          // Sélectionner aussi les sous-postes
          if (post.subItems) {
            post.subItems.forEach(subPost => newSelectedIds.add(subPost.id));
          }
        } else {
          newSelectedIds.delete(post.id);
          // Désélectionner aussi les sous-postes
          if (post.subItems) {
            post.subItems.forEach(subPost => newSelectedIds.delete(subPost.id));
          }
        }
      });
    }

    // Si c'est un poste, sélectionner/désélectionner tous ses sous-postes
    if (item.type === 'post' && item.subItems) {
      item.subItems.forEach(subPost => {
        if (shouldSelect) {
          newSelectedIds.add(subPost.id);
        } else {
          newSelectedIds.delete(subPost.id);
        }
      });
    }

    onToggle(item.id);
    setSelectedIds(newSelectedIds);
  };

  const total = calculateLineTotal(item);

  return (
    <>
      <div 
        className={`flex items-center hover:bg-gray-50 py-1 px-2 rounded transition-colors ${
          item.type === 'subCategory' ? 'bg-blue-50/30' : ''
        }`}
        style={{ marginLeft: `${indentation}px` }}
      >
        {hasSubItems ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded mr-1"
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <div className="w-6" />
        )}

        <label className="flex items-center gap-2 flex-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected || areAllSubItemsSelected || parentSelected}
            ref={input => {
              if (input) {
                input.indeterminate = !areAllSubItemsSelected && areSomeSubItemsSelected && !parentSelected;
              }
            }}
            onChange={handleToggle}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={parentSelected}
          />
          <span className={`text-sm ${item.type === 'subCategory' ? 'font-medium' : ''}`}>
            {item.name}
          </span>
          <span className="text-xs text-gray-500 ml-auto min-w-[80px] text-right">
            {total > 0 && formatNumber(total)}
          </span>
        </label>
      </div>

      {isExpanded && hasSubItems && (
        <div>
          {item.subItems.map(subItem => (
            <CategoryItem
              key={subItem.id}
              item={subItem}
              level={level + 1}
              isSelected={selectedIds.has(subItem.id)}
              onToggle={onToggle}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              parentChain={[...parentChain, item.id]}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Helper pour obtenir tous les postes enfants d'une catégorie ou sous-catégorie
function getAllPostIdsFromCategory(categoryId: string, categories: BudgetCategory[]): string[] {
  const cat = categories.find(c => c.id === categoryId);
  if (!cat) return [];
  const ids: string[] = [];
  cat.items.forEach(item => {
    if (item.type === 'post' || item.type === 'subPost') {
      ids.push(item.id);
    }
    if (item.subItems) {
      item.subItems.forEach(subItem => {
        if (subItem.type === 'post' || subItem.type === 'subPost') {
          ids.push(subItem.id);
        }
      });
    }
  });
  return ids;
}

export function CategorySelector({ 
  quoteId,
  categories = [],
  selectedCategories = [],
  currentItemId,
  currentNumber = 1,
  onUpdateItem,
  settings,
  includeSocialCharges: initialIncludeSocialCharges = false,
  onIncludeSocialChargesChange,
  onSelect,
  onClose
}: CategorySelectorProps) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(selectedCategories));
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(
    new Set(categories.map(cat => cat.id))
  );
  const [isManualMode, setIsManualMode] = React.useState(false);
  const [manualAmount, setManualAmount] = React.useState('');
  const [includeSocialCharges, setIncludeSocialCharges] = React.useState(initialIncludeSocialCharges);

  // Get quote-specific expense categories
  const { getCategories } = useExpenseCategoriesStore();
  const expenseCategories = getCategories(quoteId);

  // Inclure la catégorie des charges sociales si on est en mode groupé
  const selectableCategories = settings.socialChargesDisplay === 'grouped' 
    ? categories 
    : categories.filter(cat => cat.id !== 'social-charges').map(category => ({
      ...category,
      items: category.items.map(item => {
        // Filtrer les sous-items pour exclure l'élément courant
        const filteredSubItems = item.subItems?.filter(subItem => subItem.id !== currentItemId) || [];
        
        // Si c'est l'élément courant, ne pas l'inclure
        if (item.id === currentItemId) {
          return null;
        }

        // Sinon, retourner l'item avec ses sous-items filtrés
        return {
          ...item,
          subItems: filteredSubItems
        };
      }).filter((item): item is BudgetLine => item !== null) // Filtrer les éléments null
    }));

  const handleToggleCategory = (categoryId: string) => {
    const newSelectedIds = new Set(selectedIds);
    const category = selectableCategories.find(cat => cat.id === categoryId);
    
    if (newSelectedIds.has(categoryId)) {
      // Désélectionner la catégorie et tous ses éléments
      newSelectedIds.delete(categoryId);
      if (category) {
        // Désélectionner toutes les sous-catégories et leurs postes
        category.items.forEach(item => {
          newSelectedIds.delete(item.id);
          if (item.subItems) {
            item.subItems.forEach(subItem => newSelectedIds.delete(subItem.id));
          }
        });
      }
    } else {
      // Sélectionner la catégorie et tous ses éléments
      newSelectedIds.add(categoryId);
      if (category) {
        // Sélectionner toutes les sous-catégories et leurs postes
        category.items.forEach(item => {
          newSelectedIds.add(item.id);
          if (item.subItems) {
            item.subItems.forEach(subItem => newSelectedIds.add(subItem.id));
          }
        });
      }
    }
    setSelectedIds(newSelectedIds);
  };

  const handleToggleExpandCategory = (categoryId: string) => {
    const newExpandedCategories = new Set(expandedCategories);
    if (newExpandedCategories.has(categoryId)) {
      newExpandedCategories.delete(categoryId);
    } else {
      newExpandedCategories.add(categoryId);
    }
    setExpandedCategories(newExpandedCategories);
  };

  const handleSelectAll = () => {
    const allIds = new Set<string>();
    selectableCategories.forEach(category => {
      allIds.add(category.id);
      category.items.forEach(item => {
        allIds.add(item.id);
        if (item.subItems) {
          item.subItems.forEach(subItem => allIds.add(subItem.id));
        }
      });
    });
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSubmit = () => {
    if (isManualMode) {
      const amount = parseFloat(manualAmount.replace(',', '.'));
      if (!isNaN(amount) && amount > 0) {
        onUpdateItem({ 
          selectedCategories: [],
          rate: amount,
          includeSocialChargesInDistribution: false
        });
        onClose();
      }
      return;
    }

    onSelect(Array.from(selectedIds));
    onUpdateItem({ 
      selectedCategories: Array.from(selectedIds),
      rate: includeSocialCharges ? selectedTotal.totalWithCharges : selectedTotal.baseTotal,
      includeSocialChargesInDistribution: includeSocialCharges
    });
    onClose();
  };

  // Calculer le total des éléments sélectionnés
  const selectedTotal = React.useMemo(() => {
    let total = 0;
    let totalWithCharges = 0;
    // On veut que si une catégorie ou sous-catégorie est sélectionnée, tous ses enfants soient inclus dynamiquement
    const allSelectedIds = new Set<string>(selectedIds);
    // Ajout dynamique des enfants de toute catégorie/sous-catégorie sélectionnée
    selectableCategories.forEach(category => {
      if (selectedIds.has(category.id)) {
        getAllPostIdsFromCategory(category.id, selectableCategories).forEach(id => allSelectedIds.add(id));
      }
      category.items.forEach(item => {
        if (selectedIds.has(item.id) && item.subItems) {
          item.subItems.forEach(subItem => allSelectedIds.add(subItem.id));
        }
      });
    });
    selectableCategories.forEach(category => {
      const processItem = (item: BudgetLine): number => {
        if (item.id === currentItemId) {
          return 0;
        }
        if (allSelectedIds.has(item.id) && (item.type === 'post' || item.type === 'subPost')) {
          const lineTotal = calculateLineTotal(item, settings);
          total += lineTotal;
          if (includeSocialCharges && item.socialCharges) {
            const socialCharges = calculateSocialCharges(item, settings);
            total += socialCharges;
          }
          return lineTotal;
        }
        if (item.subItems) {
          return item.subItems.reduce((acc, subItem) => acc + processItem(subItem), 0);
        }
        return 0;
      };
      category.items.forEach(processItem);
    });
    return {
      baseTotal: total,
      totalWithCharges: includeSocialCharges ? total : total
    };
  }, [
    selectableCategories,
    // Dépendance profonde sur la structure de sélection
    getBaseStructureKey(Array.from(selectedIds), selectableCategories),
    includeSocialCharges,
    settings,
    currentItemId
  ]);

  return (
    <tr>
      <td colSpan={13}>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Sélectionner les éléments
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>
              
              {onIncludeSocialChargesChange && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeSocialCharges}
                      onChange={(e) => {
                        setIncludeSocialCharges(e.target.checked);
                        onIncludeSocialChargesChange(e.target.checked);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-blue-800">
                        Inclure les charges sociales associées
                      </span>
                      <p className="text-xs text-blue-600 mt-0.5">
                        Les charges sociales seront ajoutées au montant total pour le calcul du pourcentage
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
            
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsManualMode(!isManualMode)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      isManualMode
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {isManualMode ? 'Mode sélection' : 'Montant manuel'}
                  </button>
                  {!isManualMode && (
                    <>
                      <button
                        onClick={handleSelectAll}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        Tout sélectionner
                      </button>
                      <button
                        onClick={handleDeselectAll}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        Tout désélectionner
                      </button>
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {!isManualMode && (
                    <div className="text-sm">
                      <div className="text-gray-600">
                        Base : <span className="font-medium">{formatNumber(selectedTotal.baseTotal)} €</span>
                      </div>
                      {includeSocialCharges && selectedTotal.totalWithCharges !== selectedTotal.baseTotal && (
                        <div className="text-blue-600 text-xs mt-0.5">
                          Avec charges : <span className="font-medium">{formatNumber(selectedTotal.totalWithCharges)} €</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isManualMode ? (
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Montant à appliquer
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={manualAmount}
                        onChange={(e) => setManualAmount(e.target.value.replace(/[^\d.,]/g, ''))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0,00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Ce montant sera utilisé comme base pour le calcul du pourcentage
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto p-4">
                {selectableCategories.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucune catégorie disponible</p>
                  </div>
                )}
                {selectableCategories.map(category => (
                  <div key={category.id} className="mb-4">
                    <div className="flex items-center hover:bg-gray-50 py-1 px-2 rounded transition-colors bg-blue-100/50">
                      <button
                        onClick={() => handleToggleExpandCategory(category.id)}
                        className="p-1 hover:bg-gray-100 rounded mr-1"
                      >
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </button>
                      
                      <label className="flex items-center gap-2 flex-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(category.id)}
                          onChange={() => handleToggleCategory(category.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-bold text-blue-900">{category.name}</span>
                      </label>
                    </div>

                    {expandedCategories.has(category.id) && (
                      <div className="mt-1">
                        {category.items.map(item => (
                          <CategoryItem
                            key={item.id}
                            item={item}
                            level={1}
                            isSelected={selectedIds.has(item.id)}
                            onToggle={handleToggleCategory}
                            selectedIds={selectedIds}
                            setSelectedIds={setSelectedIds}
                            parentChain={[]}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={isManualMode ? !manualAmount : selectedIds.size === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:bg-blue-300"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}