import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { BudgetCategory, BudgetLine } from '../../../types/budget';

interface RatesModuleProps {
  categories: BudgetCategory[];
  onSelect: (selectedIds: string[]) => void;
  onClose: () => void;
  includeSocialCharges?: boolean;
  onIncludeSocialChargesChange?: (include: boolean) => void;
}

interface CategoryItemProps {
  item: BudgetLine;
  level: number;
  isSelected: boolean;
  onToggle: (id: string) => void;
  selectedIds: Set<string>;
}

function CategoryItem({ item, level, isSelected, onToggle, selectedIds }: CategoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const indentation = level * 20;

  // Vérifier si tous les sous-éléments sont sélectionnés
  const areAllSubItemsSelected = hasSubItems && item.subItems.every(
    subItem => selectedIds.has(subItem.id)
  );

  // Vérifier si certains sous-éléments sont sélectionnés
  const areSomeSubItemsSelected = hasSubItems && item.subItems.some(
    subItem => selectedIds.has(subItem.id)
  );

  const handleToggle = () => {
    onToggle(item.id);
    
    // Si on a des sous-éléments, les sélectionner/désélectionner aussi
    if (hasSubItems) {
      const shouldSelect = !isSelected;
      item.subItems.forEach(subItem => {
        if (selectedIds.has(subItem.id) !== shouldSelect) {
          onToggle(subItem.id);
        }
      });
    }
  };

  return (
    <>
      <div 
        className="flex items-center hover:bg-gray-50 py-1 px-2 rounded transition-colors"
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
            checked={isSelected || areAllSubItemsSelected}
            ref={input => {
              if (input) {
                input.indeterminate = !areAllSubItemsSelected && areSomeSubItemsSelected;
              }
            }}
            onChange={handleToggle}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className={`text-sm ${item.type === 'subCategory' ? 'font-medium' : ''}`}>
            {item.name}
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
            />
          ))}
        </div>
      )}
    </>
  );
}

export function RatesModule({ 
  categories,
  onSelect,
  onClose,
  includeSocialCharges = false,
  onIncludeSocialChargesChange
}: RatesModuleProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Filtrer les catégories pour exclure la catégorie des charges sociales
  const selectableCategories = categories.filter(cat => cat.id !== 'social-charges');

  const handleToggleCategory = (categoryId: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(categoryId)) {
      newSelectedIds.delete(categoryId);
    } else {
      newSelectedIds.add(categoryId);
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
    onSelect(Array.from(selectedIds));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Sélectionner les éléments
          </h3>
        </div>

        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
            >
              Tout sélectionner
            </button>
            <button
              onClick={handleDeselectAll}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
            >
              Tout désélectionner
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {selectableCategories.map(category => (
            <div key={category.id} className="mb-4">
              <div className="flex items-center hover:bg-gray-50 py-1 px-2 rounded transition-colors">
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
                  <span className="text-sm font-medium">{category.name}</span>
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
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {onIncludeSocialChargesChange && (
          <div className="p-4 border-t bg-gray-50">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeSocialCharges}
                onChange={(e) => onIncludeSocialChargesChange(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                Inclure les charges sociales liées aux postes sélectionnés
              </span>
            </label>
          </div>
        )}

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded disabled:bg-blue-300"
          >
            Appliquer
          </button>
        </div>
      </div>
    </div>
  );
}