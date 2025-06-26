import React, { useState, useRef, useEffect } from 'react';
import { PieChart, AlertTriangle, Percent, Trash2, Settings2, Plus } from 'lucide-react';
import { useExpenseCategoriesStore } from '../../../stores/expenseCategoriesStore';
import { formatNumber } from '../../../utils/formatNumber';

interface ExpenseDistribution {
  id: string;
  name: string;
  amount: number;
  type: 'percentage' | 'fixed';
}

interface ExpenseDistributionCellProps {
  quoteId: string;
  distributions: ExpenseDistribution[];
  totalAmount: number;
  hasSocialCharges?: boolean;
  socialChargesAmount?: number;
  onChange: (distributions: ExpenseDistribution[], includeSocialCharges?: boolean) => void;
  isWorkBudget?: boolean;
  initialDistributions?: ExpenseDistribution[];
  disabled?: boolean;
}

export function ExpenseDistributionCell({
  quoteId,
  distributions,
  totalAmount,
  hasSocialCharges = false,
  socialChargesAmount = 0,
  onChange,
  isWorkBudget = false,
  initialDistributions = [],
  disabled = false
}: ExpenseDistributionCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [includeSocialCharges, setIncludeSocialCharges] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { 
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    showExpenseDistribution
  } = useExpenseCategoriesStore();

  const expenseCategories = getCategories(quoteId);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setEditingCategory(null);
        setIsAddingCategory(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDistributionChange = (categoryId: string, value: string, type: 'percentage' | 'fixed') => {
    const numericValue = parseFloat(value) || 0;
    const newDistributions = [...distributions];
    const existingIndex = newDistributions.findIndex(d => d.id === categoryId);

    if (existingIndex >= 0) {
      if (numericValue === 0) {
        newDistributions.splice(existingIndex, 1);
      } else {
        newDistributions[existingIndex] = {
          ...newDistributions[existingIndex],
          amount: numericValue,
          type
        };
      }
    } else if (numericValue > 0) {
      const category = expenseCategories.find(c => c.id === categoryId);
      if (category) {
        newDistributions.push({
          id: categoryId,
          name: category.name,
          amount: numericValue,
          type
        });
      }
    }

    onChange(newDistributions, includeSocialCharges);
  };

  const handleColorChange = async (categoryId: string, color: string) => {
    await updateCategory(quoteId, categoryId, { color });
    setEditingCategory(null);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    // Remove distribution if it exists
    if (distributions.some(d => d.id === categoryId)) {
      const newDistributions = distributions.filter(d => d.id !== categoryId);
      onChange(newDistributions, includeSocialCharges);
    }
    // Delete the category
    await deleteCategory(quoteId, categoryId);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory(quoteId, newCategoryName.trim(), newCategoryColor);
    setNewCategoryName('');
    setNewCategoryColor('#3B82F6');
    setIsAddingCategory(false);
  };

  // Get initial distribution for a category
  const getInitialDistribution = (categoryId: string) => {
    return initialDistributions.find(d => d.id === categoryId);
  };

  if (!showExpenseDistribution) return null;

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex items-center justify-center gap-1 px-2 py-1 text-[11px] hover:bg-gray-50 rounded transition-colors group w-full ${
            distributions.length > 0 ? 'text-blue-600' : 'text-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Répartition des dépenses"
          disabled={disabled}
        >
          <PieChart size={14} className="group-hover:text-gray-700" />
        </button>
        {distributions.length > 0 && includeSocialCharges && (
          <div className="flex items-center text-blue-600" title="Charges sociales incluses dans la répartition">
            <Percent size={14} />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 right-0 mt-1 w-72 bg-white rounded-md shadow-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Répartition des dépenses</h3>
          
          {hasSocialCharges && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeSocialCharges}
                  onChange={(e) => {
                    setIncludeSocialCharges(e.target.checked);
                    onChange(distributions, e.target.checked);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-blue-800">
                  Répartir aussi les charges sociales associées
                </span>
              </label>
              {includeSocialCharges && (
                <div className="mt-2 text-xs text-blue-600">
                  Total avec charges : {formatNumber(totalAmount + socialChargesAmount)} €
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            {expenseCategories.length === 0 && !isAddingCategory && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">Aucune catégorie de répartition</p>
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md mx-auto"
                >
                  <Plus size={16} />
                  Créer une catégorie
                </button>
              </div>
            )}

            {isAddingCategory && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la catégorie
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded"
                    placeholder="Ex: Région Île-de-France"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur
                  </label>
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setIsAddingCategory(false)}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded disabled:bg-blue-300"
                  >
                    Créer
                  </button>
                </div>
              </div>
            )}

            {expenseCategories.map(category => {
              const distribution = distributions.find(d => d.id === category.id);
              const initialDist = isWorkBudget ? getInitialDistribution(category.id) : undefined;
              const isEditing = editingCategory === category.id;
              
              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <input
                          type="color"
                          value={category.color}
                          onChange={(e) => handleColorChange(category.id, e.target.value)}
                          className="w-6 h-6 rounded cursor-pointer"
                        />
                      ) : (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <span className="text-sm text-gray-700">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingCategory(isEditing ? null : category.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title={isEditing ? "Terminer" : "Modifier la couleur"}
                      >
                        <Settings2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Supprimer la catégorie"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="number"
                          value={distribution?.type === 'percentage' ? distribution.amount : ''}
                          onChange={(e) => handleDistributionChange(category.id, e.target.value, 'percentage')}
                          placeholder="0"
                          className="w-full px-2 py-1 text-sm border rounded pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                      </div>
                      {distribution?.type === 'percentage' && (
                        <div className="text-xs text-gray-500 mt-1">
                          = {formatNumber((totalAmount + (includeSocialCharges ? socialChargesAmount : 0)) * (distribution.amount / 100))} €
                        </div>
                      )}
                      {isWorkBudget && initialDist?.type === 'percentage' && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Initial: {initialDist.amount}%
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="relative">
                        <input
                          type="number"
                          value={distribution?.type === 'fixed' ? distribution.amount : ''}
                          onChange={(e) => handleDistributionChange(category.id, e.target.value, 'fixed')}
                          placeholder="0"
                          className="w-full px-2 py-1 text-sm border rounded pr-6"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">€</span>
                      </div>
                      {isWorkBudget && initialDist?.type === 'fixed' && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Initial: {formatNumber(initialDist.amount)} €
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {expenseCategories.length > 0 && !isAddingCategory && (
              <button
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md w-full justify-center mt-4"
              >
                <Plus size={14} />
                Ajouter une catégorie
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}