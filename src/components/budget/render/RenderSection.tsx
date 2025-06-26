import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { RenderSubCategoryType, RenderItem } from './RenderTable';
import { RenderSubCategory } from './RenderSubCategory';
import { AddItemModal } from './AddItemModal';
import { RenderItemDetails } from './RenderItemDetails';
import { SocialChargeRate } from '../../../types/quoteSettings';

interface RenderSectionProps {
  title: string;
  type: 'production' | 'postproduction';
  socialChargeRates: SocialChargeRate[];
  categories: { type: RenderSubCategoryType; items: RenderItem[] }[];
  onAddItem: (subType: RenderSubCategoryType) => string;
  onUpdateItem: (subType: RenderSubCategoryType, itemId: string, updates: Partial<RenderItem>) => void;
  onReplaceItem: (subType: RenderSubCategoryType, item: RenderItem) => void;
  onDeleteItem: (subType: RenderSubCategoryType, itemId: string) => void;
  onSelectItem: (item: RenderItem) => void;
  selectedItemId?: string;
}

export function RenderSection({
  title,
  type,
  socialChargeRates,
  categories,
  onAddItem,
  onUpdateItem,
  onReplaceItem,
  onDeleteItem,
  onSelectItem,
  selectedItemId
}: RenderSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingItemType, setAddingItemType] = useState<RenderSubCategoryType>('salaries');

  // Get the categories in the correct order
  const salariesCategory = categories.find(c => c.type === 'salaries') || { type: 'salaries', items: [] };
  const suppliersCategory = categories.find(c => c.type === 'suppliers') || { type: 'suppliers', items: [] };
  const expensesCategory = categories.find(c => c.type === 'expenses') || { type: 'expenses', items: [] };

  const handleAddClick = (itemType: RenderSubCategoryType) => {
    setAddingItemType(itemType);
    setShowAddModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => handleAddClick('salaries')}
            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
          >
            <span className="flex items-center gap-1">
              <Plus size={14} />
              Salaire
            </span>
          </button>
          <button
            onClick={() => handleAddClick('suppliers')}
            className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100"
          >
            <span className="flex items-center gap-1">
              <Plus size={14} />
              Prestataire
            </span>
          </button>
          <button
            onClick={() => handleAddClick('expenses')}
            className="px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded hover:bg-amber-100"
          >
            <span className="flex items-center gap-1">
              <Plus size={14} />
              Note de frais
            </span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="divide-y divide-gray-200">
          {/* Salaries Section */}
          <RenderSubCategory
            title="Salaires"
            type="salaries"
            socialChargeRates={socialChargeRates}
            items={salariesCategory.items}
            onAddItem={() => {
              handleAddClick('salaries');
              return '';
            }}
            onUpdateItem={(itemId, updates) => onUpdateItem('salaries', itemId, updates)}
            onReplaceItem={(item) => onReplaceItem('salaries', item)}
            onDeleteItem={(itemId) => onDeleteItem('salaries', itemId)}
            onSelectItem={onSelectItem}
            selectedItemId={selectedItemId}
          />
          
          {/* Suppliers Section */}
          <RenderSubCategory
            title="Prestataires"
            type="suppliers"
            socialChargeRates={socialChargeRates}
            items={suppliersCategory.items}
            onAddItem={() => {
              handleAddClick('suppliers');
              return '';
            }}
            onUpdateItem={(itemId, updates) => onUpdateItem('suppliers', itemId, updates)}
            onReplaceItem={(item) => onReplaceItem('suppliers', item)}
            onDeleteItem={(itemId) => onDeleteItem('suppliers', itemId)}
            onSelectItem={onSelectItem}
            selectedItemId={selectedItemId}
          />
          
          {/* Expenses Section */}
          <RenderSubCategory
            title="Notes de frais"
            type="expenses"
            socialChargeRates={socialChargeRates}
            items={expensesCategory.items}
            onAddItem={() => {
              handleAddClick('expenses');
              return '';
            }}
            onUpdateItem={(itemId, updates) => onUpdateItem('expenses', itemId, updates)}
            onReplaceItem={(item) => onReplaceItem('expenses', item)}
            onDeleteItem={(itemId) => onDeleteItem('expenses', itemId)}
            onSelectItem={onSelectItem}
            selectedItemId={selectedItemId}
          />
        </div>
      )}
      
      {showAddModal && (
        <AddItemModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={(newItem) => {
            console.log("Élément reçu dans RenderSection:", newItem);
            // Utiliser la nouvelle fonction pour remplacer complètement l'élément
            onReplaceItem(addingItemType, newItem);
            setShowAddModal(false);
          }}
          type={addingItemType}
          socialChargeRates={socialChargeRates}
        />
      )}
    </div>
  );
}