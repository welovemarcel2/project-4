import React, { useState, useRef, useEffect } from 'react';
import { PieChart, AlertTriangle, Percent, Trash2, Settings2, Plus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Distribution } from '../../../types/distribution';
import { formatNumber } from '../../../utils/formatNumber';
import { useExpenseCategoriesStore } from '../../../stores/expenseCategoriesStore';
import { calculateSocialCharges } from '../../../utils/budgetCalculations/base';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface DistributionCellProps {
  quoteId: string;
  itemId: string;
  totalAmount: number;
  hasSocialCharges?: boolean;
  socialChargesAmount?: number;
  onChange: (distributions: Distribution[], includeSocialCharges: boolean) => void;
  disabled?: boolean;
}

export function DistributionCell({
  quoteId,
  itemId,
  totalAmount,
  hasSocialCharges = false,
  socialChargesAmount = 0,
  onChange,
  disabled = false
}: DistributionCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [includeSocialCharges, setIncludeSocialCharges] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string; color: string }[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ name: '', color: '#3B82F6' });
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { getCategories, createCategory, toggleExpenseDistribution, showExpenseDistribution, loadCategories } = useExpenseCategoriesStore();

  // Load categories when menu opens
  useEffect(() => {
    if (!isOpen || !quoteId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Charger les catégories depuis la base de données
        await loadCategories(quoteId);
        
        // Récupérer les catégories depuis le store
        const storeCategories = getCategories(quoteId);
        setCategories(storeCategories);
        
        // Charger les distributions pour cet élément
        const { data: distributionsData, error: distributionsError } = await supabase
          .from('distributions')
          .select('*')
          .eq('item_id', itemId);

        if (distributionsError) throw distributionsError;

        // Mapper les distributions avec les noms des catégories
        const loadedDistributions = distributionsData.map(dist => ({
          id: dist.category_id,
          name: storeCategories.find(cat => cat.id === dist.category_id)?.name || '',
          amount: dist.amount,
          type: dist.type as 'percentage' | 'fixed'
        }));

        setDistributions(loadedDistributions);
        setIncludeSocialCharges(distributionsData.length > 0 ? distributionsData[0].include_social_charges : false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isOpen, quoteId, itemId, getCategories, loadCategories]);

  // Handle click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim() || !quoteId) return;

    try {
      setError(null);
      
      // Utiliser la fonction du store pour créer la catégorie
      await createCategory(quoteId, newCategory.name.trim(), newCategory.color);
      
      // Récupérer les catégories mises à jour
      const updatedCategories = getCategories(quoteId);
      
      // Mettre à jour l'état local
      setCategories(updatedCategories);
      setNewCategory({ name: '', color: '#3B82F6' });
      setIsAddingCategory(false);
      
      // Activer l'affichage des colonnes de répartition si nécessaire
      if (!showExpenseDistribution) {
        toggleExpenseDistribution();
      }
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Erreur lors de la création de la catégorie');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('distribution_categories')
        .delete()
        .eq('id', id)
        .eq('quote_id', quoteId);

      if (error) throw error;

      // Mettre à jour l'état local
      setCategories(prev => prev.filter(cat => cat.id !== id));
      setDistributions(prev => prev.filter(dist => dist.id !== id));
      onChange(distributions.filter(dist => dist.id !== id), includeSocialCharges);
    } catch (err) {
      console.error('Error deleting category:', err);
      setError('Erreur lors de la suppression de la catégorie');
    }
  };

  const handleDistributionChange = async (categoryId: string, value: string, type: 'percentage' | 'fixed') => {
    const numericValue = parseFloat(value) || 0;
    const newDistributions = [...distributions];
    const existingIndex = newDistributions.findIndex(d => d.id === categoryId);
    const category = categories.find(c => c.id === categoryId);

    if (!category) return;

    try {
      if (existingIndex >= 0) {
        if (numericValue === 0) {
          // Delete distribution
          await supabase
            .from('distributions')
            .delete()
            .eq('item_id', itemId)
            .eq('category_id', categoryId);

          newDistributions.splice(existingIndex, 1);
        } else {
          // Update distribution
          await supabase
            .from('distributions')
            .upsert({
              item_id: itemId,
              category_id: categoryId,
              amount: numericValue,
              type,
              include_social_charges: includeSocialCharges
            });

          newDistributions[existingIndex] = {
            ...newDistributions[existingIndex],
            amount: numericValue,
            type
          };
        }
      } else if (numericValue > 0) {
        // Create new distribution
        await supabase
          .from('distributions')
          .insert({
            item_id: itemId,
            category_id: categoryId,
            amount: numericValue,
            type,
            include_social_charges: includeSocialCharges
          });

        newDistributions.push({
          id: categoryId,
          name: category.name,
          amount: numericValue,
          type
        });
      }

      setDistributions(newDistributions);
      onChange(newDistributions, includeSocialCharges);
      
      // Activer l'affichage des colonnes de répartition si nécessaire
      if (!showExpenseDistribution && newDistributions.length > 0) {
        toggleExpenseDistribution();
      }
    } catch (err) {
      console.error('Error updating distribution:', err);
      setError('Erreur lors de la mise à jour de la répartition');
    }
  };

  const handleIncludeSocialChargesChange = async (include: boolean) => {
    setIncludeSocialCharges(include);
    
    // Update all existing distributions
    try {
      if (distributions.length > 0) {
        const updates = distributions.map(dist => ({
          item_id: itemId,
          category_id: dist.id,
          amount: dist.amount,
          type: dist.type,
          include_social_charges: include
        }));
        
        await supabase
          .from('distributions')
          .upsert(updates);
      }
      
      onChange(distributions, include);
    } catch (err) {
      console.error('Error updating social charges inclusion:', err);
      setError('Erreur lors de la mise à jour de l\'inclusion des charges sociales');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-center gap-1 px-2 py-1 text-[11px] hover:bg-gray-50 rounded transition-colors group w-full ${
          distributions.length > 0 ? 'text-blue-600' : 'text-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="Répartition"
        disabled={disabled}
      >
        <PieChart size={14} className="group-hover:text-gray-700" />
      </button>

      {isOpen && (
        <div className="absolute z-10 right-0 mt-1 w-72 bg-white rounded-md shadow-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Répartition</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          {hasSocialCharges && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeSocialCharges}
                  onChange={(e) => handleIncludeSocialChargesChange(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-blue-800">
                  Inclure les charges sociales
                </span>
              </label>
              {includeSocialCharges && (
                <div className="mt-2 text-xs text-blue-600">
                  Total avec charges : {formatNumber(totalAmount + socialChargesAmount)} €
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-4 text-gray-500">
                Chargement...
              </div>
            ) : categories.length === 0 && !isAddingCategory ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-3">Aucune répartition</p>
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-md mx-auto"
                >
                  <Plus size={16} />
                  Créer une répartition
                </button>
              </div>
            ) : (
              <>
                {categories.map(category => {
                  const distribution = distributions.find(d => d.id === category.id);
                  
                  return (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm text-gray-700">{category.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Supprimer la répartition"
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
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!isAddingCategory && (
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md w-full justify-center mt-4"
                  >
                    <Plus size={14} />
                    Ajouter une répartition
                  </button>
                )}

                {isAddingCategory && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom de la répartition
                      </label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
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
                        value={newCategory.color}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
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
                        disabled={!newCategory.name.trim()}
                        className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded disabled:bg-blue-300"
                      >
                        Créer
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}