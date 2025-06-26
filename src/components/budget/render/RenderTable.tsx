import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Download, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { BudgetCategory } from '../../../types/budget';
import { Quote } from '../../../types/project';
import { calculateTotalCosts, calculateSocialChargesByType } from '../../../utils/budgetCalculations/totals';
import { RenderHeader } from './RenderHeader';
import { RenderSummary } from './RenderSummary';
import { RenderSection } from './RenderSection';
import { generateId } from '../../../utils/generateId';
import { useRenderStore } from '../../../stores/renderStore';
import { formatNumber } from '../../../utils/formatNumber';
import { useCurrencyStore } from '../../../stores/currencyStore';
import { QuoteSettings } from '../../../types/quoteSettings';
import { DEFAULT_SETTINGS } from '../../../types/quoteSettings';
import { RenderItemDetails } from './RenderItemDetails';

interface RenderTableProps {
  budget: BudgetCategory[];
  additiveQuotes?: Quote[];
  additiveQuoteBudgets?: Record<string, BudgetCategory[]>;
  settings?: QuoteSettings;
  selectedQuote?: Quote;
  quoteId?: string;
  onSaveChanges?: () => void;
  isDirty?: boolean;
}

export type RenderSectionType = 'production' | 'postproduction';
export type RenderSubCategoryType = 'salaries' | 'suppliers' | 'expenses';
export type InvoiceStatus = 'not_received' | 'received' | 'to_pay' | 'paid';

export interface RenderItem {
  id: string;
  type: RenderSubCategoryType;
  firstName?: string;
  lastName?: string;
  position?: string;
  companyName?: string;
  grossSalary?: number;
  socialChargesPercent?: number;
  totalCost?: number;
  workDays?: string[]; // Array of dates worked in ISO format
  dailyRate?: number;
  amountHT?: number;
  amountTTC?: number;
  invoiceStatus: InvoiceStatus;
  attachment?: File;
  iban?: string;
}

export interface RenderSubCategory {
  type: RenderSubCategoryType;
  items: RenderItem[];
}

export interface RenderMainCategory {
  type: RenderSectionType;
  subCategories: RenderSubCategory[];
}

export function RenderTable({ 
  budget,
  additiveQuotes = [],
  additiveQuoteBudgets = {},
  settings = DEFAULT_SETTINGS,
  selectedQuote,
  quoteId,
  onSaveChanges,
  isDirty
}: RenderTableProps) {
  const { 
    categories, 
    isCompleted, 
    setIsCompleted, 
    addItem, 
    updateItem, 
    replaceItem,
    deleteItem 
  } = useRenderStore();
  
  const [selectedItem, setSelectedItem] = useState<RenderItem | null>(null);
  const { selectedCurrency, currencies } = useCurrencyStore();
  const currencySymbol = currencies.find(c => c.code === selectedCurrency)?.symbol || '€';
  
  // Récupérer les noms de taux personnalisés
  const rate1Label = settings?.rateLabels?.rate1Label || 'TX 1';
  const rate2Label = settings?.rateLabels?.rate2Label || 'TX 2';
  
  // Récupérer les taux de charges sociales du projet
  const socialChargeRates = settings?.socialChargeRates || [
    { id: '65', label: 'Techniciens', rate: 0.65 },
    { id: '55', label: 'Artistes', rate: 0.55 },
    { id: '3', label: 'Auteur', rate: 0.03 }
  ];

  // Calculate initial budget total (budget principal + additifs)
  const initialBudget = React.useMemo(() => {
    const mainBudget = calculateTotalCosts(budget, {
      socialChargeRates: [],
      availableUnits: [],
      defaultAgencyPercent: 0,
      defaultMarginPercent: 0,
      showEmptyItems: false,
      socialChargesDisplay: 'detailed',
      applySocialChargesMargins: false
    });

    const additivesTotal = additiveQuotes.reduce((total, quote) => {
      const additiveBudget = additiveQuoteBudgets[quote.id] || [];
      const additiveTotal = calculateTotalCosts(additiveBudget, {
        socialChargeRates: [],
        availableUnits: [],
        defaultAgencyPercent: 0,
        defaultMarginPercent: 0,
        showEmptyItems: false,
        socialChargesDisplay: 'detailed',
        applySocialChargesMargins: false
      });
      return total + additiveTotal.grandTotal;
    }, 0);

    return {
      baseCost: mainBudget.baseCost,
      socialCharges: mainBudget.totalSocialCharges,
      agency: mainBudget.agency,
      margin: mainBudget.margin,
      grandTotal: mainBudget.grandTotal + additivesTotal
    };
  }, [budget, additiveQuotes, additiveQuoteBudgets]);

  // Calculate current total from render items
  const currentTotal = React.useMemo(() => {
    let totalHT = 0;
    let totalTTC = 0;
    let totalSalaries = 0;
    let totalSocialCharges = 0;

    categories.forEach(category => {
      category.subCategories.forEach(subCategory => {
        subCategory.items.forEach(item => {
          if (item.type === 'suppliers' || item.type === 'expenses') {
            // For suppliers and expenses, use amountHT
            totalHT += item.amountHT || 0;
            totalTTC += item.amountTTC || 0;
          } else if (item.type === 'salaries') {
            // For salaries, calculate gross + social charges
            const grossSalary = item.grossSalary || 0;
            const socialChargesPercent = item.socialChargesPercent || 0;
            const socialCharges = grossSalary * (socialChargesPercent / 100);
            
            totalSalaries += grossSalary;
            totalSocialCharges += socialCharges;
            totalHT += grossSalary + socialCharges;
            totalTTC += grossSalary + socialCharges; // Same as HT for salaries
          }
        });
      });
    });

    return {
      totalHT,
      totalTTC,
      totalSalaries,
      totalSocialCharges
    };
  }, [categories]);

  // Calculate difference between initial and final budget
  const budgetDifference = React.useMemo(() => {
    const finalTotal = currentTotal.totalHT + initialBudget.agency + initialBudget.margin;
    const difference = finalTotal - initialBudget.grandTotal;
    const percentDifference = initialBudget.grandTotal > 0 
      ? (difference / initialBudget.grandTotal) * 100 
      : 0;
    
    return {
      difference,
      percentDifference,
      isPositive: difference > 0,
      isNegative: difference < 0
    };
  }, [currentTotal, initialBudget]);

  // Initialize categories if they are empty
  useEffect(() => {
    if (categories.length === 0) {
      const initialCategories: RenderMainCategory[] = [
        {
          type: 'production',
          subCategories: [
            { type: 'salaries', items: [] },
            { type: 'suppliers', items: [] },
            { type: 'expenses', items: [] }
          ]
        },
        {
          type: 'postproduction',
          subCategories: [
            { type: 'salaries', items: [] },
            { type: 'suppliers', items: [] },
            { type: 'expenses', items: [] }
          ]
        }
      ];
      
      // Initialize the store with empty categories
      initialCategories.forEach(category => {
        category.subCategories.forEach(subCategory => {
          // No need to add initial items
        });
      });
    }
  }, [categories]);

  const handleAddItem = (sectionType: RenderSectionType, subCategoryType: RenderSubCategoryType) => {
    const newItem: RenderItem = {
      id: generateId(),
      type: subCategoryType,
      invoiceStatus: 'not_received',
      // Ajouter des valeurs par défaut selon le type
      ...(subCategoryType === 'salaries' ? { 
        grossSalary: 0, 
        socialChargesPercent: 65, // Valeur par défaut, sera remplacée par le choix de l'utilisateur
        workDays: []
      } : {}),
      ...(subCategoryType === 'suppliers' || subCategoryType === 'expenses' ? { 
        amountHT: 0, 
        amountTTC: 0 
      } : {})
    };
    
    console.log("Création d'un nouvel élément:", newItem);
    addItem(sectionType, subCategoryType, newItem);
    setSelectedItem(newItem);
    return newItem.id;
  };

  const handleUpdateItem = (sectionType: RenderSectionType, subCategoryType: RenderSubCategoryType, itemId: string, updates: Partial<RenderItem>) => {
    console.log("Mise à jour d'un élément:", sectionType, subCategoryType, itemId, updates);
    
    updateItem(sectionType, subCategoryType, itemId, updates);
    
    // Update selected item if it's the one being modified
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem({ ...selectedItem, ...updates });
    }
  };

  const handleReplaceItem = (sectionType: RenderSectionType, subCategoryType: RenderSubCategoryType, item: RenderItem) => {
    console.log("Remplacement complet d'un élément:", sectionType, subCategoryType, item);
    
    replaceItem(sectionType, subCategoryType, item);
    
    // Update selected item if it's the one being replaced
    if (selectedItem && selectedItem.id === item.id) {
      setSelectedItem(item);
    }
  };

  const handleDeleteItem = (sectionType: RenderSectionType, subCategoryType: RenderSubCategoryType, itemId: string) => {
    deleteItem(sectionType, subCategoryType, itemId);
    
    // Deselect item if it's deleted
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem(null);
    }
  };

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting render data');
    
    // Create a JSON representation of the render data
    const renderData = {
      initialBudget,
      currentTotal,
      budgetDifference,
      categories,
      isCompleted
    };
    
    // Create a blob and download link
    const blob = new Blob([JSON.stringify(renderData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'budget-render.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Budget Summary Header */}
      <div className="grid grid-cols-3 gap-6">
        {/* Bloc de gauche: Rappel du budget initial */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Budget Initial</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Coût de base</div>
              <div className="font-medium">{formatNumber(initialBudget.baseCost)} {currencySymbol}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Charges sociales</div>
              <div className="font-medium">{formatNumber(initialBudget.socialCharges)} {currencySymbol}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">{rate1Label}</div>
              <div className="font-medium">{formatNumber(initialBudget.agency)} {currencySymbol}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">{rate2Label}</div>
              <div className="font-medium">{formatNumber(initialBudget.margin)} {currencySymbol}</div>
            </div>
            <div className="pt-2 border-t flex justify-between items-center">
              <div className="text-sm font-medium text-gray-700">Total HT prévu</div>
              <div className="text-lg font-bold text-blue-600">{formatNumber(initialBudget.grandTotal)} {currencySymbol}</div>
            </div>
          </div>
        </div>
        
        {/* Bloc du milieu: Identique au bloc du budget initial */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Rendu Final</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Salaires bruts</div>
              <div className="font-medium">{formatNumber(currentTotal.totalSalaries)} {currencySymbol}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Charges sociales</div>
              <div className="font-medium">{formatNumber(currentTotal.totalSocialCharges)} {currencySymbol}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Prestataires & Frais (HT)</div>
              <div className="font-medium">{formatNumber(currentTotal.totalHT - currentTotal.totalSalaries - currentTotal.totalSocialCharges)} {currencySymbol}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">{rate1Label}</div>
              <div className="font-medium">{formatNumber(initialBudget.agency)} {currencySymbol}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">{rate2Label}</div>
              <div className="font-medium">{formatNumber(initialBudget.margin)} {currencySymbol}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">TVA</div>
              <div className="font-medium">{formatNumber(currentTotal.totalTTC - currentTotal.totalHT)} {currencySymbol}</div>
            </div>
            <div className="pt-2 border-t flex justify-between items-center">
              <div className="text-sm font-medium text-gray-700">Total HT final</div>
              <div className="text-lg font-bold text-blue-600">{formatNumber(currentTotal.totalHT + initialBudget.agency + initialBudget.margin)} {currencySymbol}</div>
            </div>
          </div>
        </div>
        
        {/* Bloc de droite: Différence entre budget initial et rendu */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Différence</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Budget initial</div>
              <div className="font-medium">{formatNumber(initialBudget.grandTotal)} {currencySymbol}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Budget final</div>
              <div className="font-medium">{formatNumber(currentTotal.totalHT + initialBudget.agency + initialBudget.margin)} {currencySymbol}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Différence</div>
              <div className={`font-medium ${budgetDifference.isPositive ? 'text-red-600' : budgetDifference.isNegative ? 'text-green-600' : ''}`}>
                {budgetDifference.isPositive ? '+' : ''}{formatNumber(budgetDifference.difference)} {currencySymbol}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Pourcentage</div>
              <div className={`font-medium ${budgetDifference.isPositive ? 'text-red-600' : budgetDifference.isNegative ? 'text-green-600' : ''}`}>
                {budgetDifference.isPositive ? '+' : ''}{formatNumber(budgetDifference.percentDifference)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 w-full">
        {/* Production Section */}
        <RenderSection
          title="Production"
          type="production"
          socialChargeRates={socialChargeRates}
          categories={categories.find(c => c.type === 'production')?.subCategories || []}
          onAddItem={(subType) => handleAddItem('production', subType)}
          onUpdateItem={(subType, itemId, updates) => handleUpdateItem('production', subType, itemId, updates)}
          onReplaceItem={(subType, item) => handleReplaceItem('production', subType, item)}
          onDeleteItem={(subType, itemId) => handleDeleteItem('production', subType, itemId)}
          onSelectItem={setSelectedItem}
          selectedItemId={selectedItem?.id}
        />
        
        {/* Post-Production Section */}
        <RenderSection
          title="Post-Production"
          type="postproduction"
          socialChargeRates={socialChargeRates}
          categories={categories.find(c => c.type === 'postproduction')?.subCategories || []}
          onAddItem={(subType) => handleAddItem('postproduction', subType)}
          onUpdateItem={(subType, itemId, updates) => handleUpdateItem('postproduction', subType, itemId, updates)}
          onReplaceItem={(subType, item) => handleReplaceItem('postproduction', subType, item)}
          onDeleteItem={(subType, itemId) => handleDeleteItem('postproduction', subType, itemId)}
          onSelectItem={setSelectedItem}
          selectedItemId={selectedItem?.id}
        />
      </div>
      
      {/* Item Details Popup */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <RenderItemDetails 
              item={selectedItem}
              socialChargeRates={socialChargeRates}
              onUpdate={(updates) => {
                // Find the category and subcategory of the item
                for (const category of categories) {
                  for (const subCategory of category.subCategories) {
                    const itemIndex = subCategory.items.findIndex(item => item.id === selectedItem.id);
                    if (itemIndex !== -1) {
                      handleUpdateItem(category.type, subCategory.type, selectedItem.id, updates);
                      return;
                    }
                  }
                }
              }}
              onDelete={() => {
                // Find the category and subcategory of the item
                for (const category of categories) {
                  for (const subCategory of category.subCategories) {
                    const itemIndex = subCategory.items.findIndex(item => item.id === selectedItem.id);
                    if (itemIndex !== -1) {
                      handleDeleteItem(category.type, subCategory.type, selectedItem.id);
                      setSelectedItem(null); // Close the popup after deleting
                      return;
                    }
                  }
                }
              }}
            />
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}