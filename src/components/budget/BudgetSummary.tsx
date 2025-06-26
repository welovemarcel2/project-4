import React from 'react';
import { BudgetCategory, BudgetLine } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { Project } from '../../types/project';
import { formatNumber } from '../../utils/formatNumber';
import { calculateLineTotal, calculateLineTotalWithCurrency } from '../../utils/budgetCalculations/base';
import { calculateSocialCharges } from '../../utils/budgetCalculations/base';
import { ExportButton } from './ExportButton';
import { CurrencyDisplay } from './CurrencyDisplay';
import { useExpenseCategoriesStore } from '../../stores/expenseCategoriesStore';
import { useCurrencyStore } from '../../stores/currencyStore';
import { getBaseStructureKey, computePercentageBase } from '../../utils/budget/percentageBase';

interface BudgetSummaryProps {
  categories: BudgetCategory[];
  settings: QuoteSettings;
  notes: string;
  isWorkBudgetActive?: boolean;
  quoteId: string;
  project: Project;
}

export function BudgetSummary({ categories, settings, notes, isWorkBudgetActive, quoteId, project }: BudgetSummaryProps) {
  const { getCategories, showExpenseDistribution } = useExpenseCategoriesStore();
  const expenseCategories = getCategories(quoteId);
  const { selectedCurrency, convertAmount } = useCurrencyStore();
  
  // Make sure categories is always an array
  const categoriesArray = Array.isArray(categories) ? categories : [];

  // Obtenir les labels des taux personnalisés
  const rate1Label = settings.rateLabels?.rate1Label || 'TX 1';
  const rate2Label = settings.rateLabels?.rate2Label || 'TX 2';

  // Calculate totals
  const { baseCost, totalCost, socialChargesByType, totalSocialCharges, agency, margin, agencyPercent, marginPercent, grandTotal, allPercentageBases } = React.useMemo(() => {
    let totalBaseCost = 0;
    let totalWeightedAgency = 0;
    let totalWeightedMargin = 0;
    let totalSocialCharges = 0;
    const socialChargesByType: Record<string, number> = {};
    const allPercentageBases: string[] = [];

    const processItem = (item: BudgetLine) => {
      let itemTotal = 0;
      
      if (item.type === 'subCategory' && item.subItems) {
        item.subItems.forEach(subItem => {
          const subItemTotal = processItem(subItem);
          itemTotal += subItemTotal;
        });
      } else {
        if (item.unit === '%') {
          const baseResult = computePercentageBase(item.selectedCategories || [], categoriesArray, settings, () => 1, 'EUR');
          allPercentageBases.push(getBaseStructureKey(item.selectedCategories || [], categoriesArray));
          itemTotal = (item.rate * baseResult.total) / 100;
        } else {
          itemTotal = calculateLineTotalWithCurrency(item, settings, () => 1, 'EUR');
        }

        // Add to weighted percentages
        if (itemTotal > 0) {
          totalWeightedAgency += itemTotal * (item.agencyPercent || 0);
          totalWeightedMargin += itemTotal * (item.marginPercent || 0);
        }

        // Calculate social charges
        if (item.socialCharges) {
          const rate = settings.socialChargeRates.find(r => r.id === item.socialCharges);
          if (rate) {
            let baseAmount = calculateLineTotalWithCurrency(item, settings, () => 1, 'EUR');
            const charges = baseAmount * rate.rate;
            
            if (charges > 0) {
              socialChargesByType[item.socialCharges] = (socialChargesByType[item.socialCharges] || 0) + charges;
              totalSocialCharges += charges;
            }
          }
        }
      }

      return itemTotal;
    };

    // Process all categories
    categoriesArray.forEach(category => {
      if (category.id !== 'social-charges') {
        category.items.forEach(item => {
          const itemTotal = processItem(item);
          totalBaseCost += itemTotal;
        });
      }
    });

    // Calculate weighted average percentages
    const agencyPercent = totalBaseCost > 0 ? (totalWeightedAgency / totalBaseCost) : settings.defaultAgencyPercent;
    const marginPercent = totalBaseCost > 0 ? (totalWeightedMargin / totalBaseCost) : settings.defaultMarginPercent;

    // Calculate final amounts
    const totalCost = totalBaseCost + totalSocialCharges;
    
    // Calculate agency and margin amounts for social charges using their specific rates
    let socialChargesAgency = 0;
    let socialChargesMargin = 0;
    
    Object.entries(socialChargesByType).forEach(([rateId, amount]) => {
      const rate = settings.socialChargeRates.find(r => r.id === rateId);
      if (rate) {
        // Use the specific rate's agency and margin percentages or fall back to defaults
        const rateAgencyPercent = rate.agencyPercent !== undefined ? rate.agencyPercent : settings.defaultAgencyPercent;
        const rateMarginPercent = rate.marginPercent !== undefined ? rate.marginPercent : settings.defaultMarginPercent;
        
        socialChargesAgency += amount * (rateAgencyPercent / 100);
        socialChargesMargin += amount * (rateMarginPercent / 100);
      }
    });
    
    // Calculate agency and margin for base cost
    const baseAgency = totalBaseCost * (agencyPercent / 100);
    const baseMargin = totalBaseCost * (marginPercent / 100);
    
    // Total agency and margin
    const agency = baseAgency + socialChargesAgency;
    const margin = baseMargin + socialChargesMargin;
    
    const grandTotal = totalCost + agency + margin;

    return {
      baseCost: totalBaseCost,
      totalCost,
      socialChargesByType,
      totalSocialCharges,
      agency,
      margin,
      agencyPercent,
      marginPercent,
      grandTotal,
      allPercentageBases
    };
  }, [categories, settings, getBaseStructureKey(
    ([] as string[]).concat(...(Array.isArray(categories) ? categories.flatMap(cat => cat.items.filter(i => i.unit === '%').map(i => i.selectedCategories || [])) : [])),
    Array.isArray(categories) ? categories : []
  )]);

  // Filter categories based on settings
  const displayCategories = settings.socialChargesDisplay === 'grouped'
    ? categoriesArray
    : categoriesArray.filter(cat => cat.id !== 'social-charges');

  // Calculate expense category totals
  const expenseCategoryTotals = React.useMemo(() => {
    if (!showExpenseDistribution) return {};
    
    const totals: Record<string, number> = {};
    
    // Fonction récursive pour calculer les distributions
    const calculateDistributedAmount = (item: BudgetLine, categoryId: string): number => {
      const distribution = item.distributions?.find(d => d.id === categoryId);
      if (!distribution) return 0;
      
      const baseAmount = calculateLineTotalWithCurrency(item, settings, convertAmount, selectedCurrency);
      
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
          sum + calculateDistributedAmount(subItem, categoryId), 0);
      }
      
      return distributedAmount;
    };
    
    // Calculer les totaux pour chaque catégorie de dépense
    expenseCategories.forEach(category => {
      let categoryTotal = 0;
      
      categoriesArray.forEach(budgetCategory => {
        if (budgetCategory.id !== 'social-charges') {
          budgetCategory.items.forEach(item => {
            categoryTotal += calculateDistributedAmount(item, category.id);
          });
        }
      });
      
      totals[category.id] = categoryTotal;
    });
    
    return totals;
  }, [categoriesArray, settings, expenseCategories, showExpenseDistribution, selectedCurrency, convertAmount]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Catégories</h3>
        <div className="space-y-2">
          {displayCategories.map((category, index) => {
            // Calculate category total
            const categoryTotal = category.items.reduce((total, item) => {
              if (item.type === 'subCategory') {
                return total + (item.subItems?.reduce((subTotal, subItem) => {
                  if (subItem.unit === '%') {
                    return subTotal + ((subItem.rate * (subItem.number || 0)) / 100);
                  }
                  // Utiliser la nouvelle fonction avec conversion automatique
                  const subItemTotal = calculateLineTotalWithCurrency(subItem, settings, convertAmount, selectedCurrency);
                  return subTotal + subItemTotal;
                }, 0) || 0);
              }
              if (item.unit === '%') {
                return total + ((item.rate * (item.number || 0)) / 100);
              }
              // Utiliser la nouvelle fonction avec conversion automatique
              return total + calculateLineTotalWithCurrency(item, settings, convertAmount, selectedCurrency);
            }, 0);

            if (categoryTotal === 0 && !settings.showEmptyItems) {
              return null;
            }

            return (
              <div key={category.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400 font-mono">{index + 1}</span>
                  <span className="text-gray-600 uppercase tracking-wide font-medium">{category.name}</span>
                </div>
                <span className="font-medium">
                  {formatNumber(categoryTotal)} <CurrencyDisplay showSymbol={false} />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">
            {formatNumber(totalCost)} <CurrencyDisplay showSymbol={true} />
          </h3>
          <p className="text-sm text-gray-500 mt-1">Coût total (Coût de base + Charges sociales)</p>
        </div>

        <div className="space-y-2 pt-4 border-t mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Coût de base</span>
            <span className="text-sm font-medium">{formatNumber(baseCost)} <CurrencyDisplay showSymbol={true} /></span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Charges sociales</span>
              <span className="text-sm font-medium">{formatNumber(totalSocialCharges)} <CurrencyDisplay showSymbol={true} /></span>
            </div>
            {Object.entries(socialChargesByType).map(([id, amount]) => {
              const rate = settings.socialChargeRates.find(r => r.id === id);
              if (!rate || amount === 0) return null;
              return (
                <div key={id} className="flex justify-between items-center pl-4">
                  <span className="text-xs text-gray-500">{rate.label}</span>
                  <span className="text-xs text-gray-500">{formatNumber(amount)} <CurrencyDisplay showSymbol={true} /></span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t mt-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span>{rate1Label}</span>
              <span className="text-xs text-gray-400">({formatNumber(agencyPercent)}%)</span>
            </div>
            <span className="text-sm font-medium">{formatNumber(agency)} <CurrencyDisplay showSymbol={true} /></span>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span>{rate2Label}</span>
              <span className="text-xs text-gray-400">({formatNumber(marginPercent)}%)</span>
            </div>
            <span className="text-sm font-medium">{formatNumber(margin)} <CurrencyDisplay showSymbol={true} /></span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100 p-6 flex flex-col">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Total HT</h4>
        <p className="text-4xl font-bold text-blue-800 mb-4">
          {formatNumber(grandTotal)} <CurrencyDisplay showSymbol={true} />
        </p>
        
        {/* Affichage des totaux par catégorie de dépense */}
        {showExpenseDistribution && expenseCategories.length > 0 && (
          <div className="mt-2 pt-4 border-t border-blue-200">
            <h5 className="text-sm font-medium text-blue-800 mb-2">Répartition des dépenses</h5>
            <div className="space-y-2">
              {expenseCategories.map(category => {
                const total = expenseCategoryTotals[category.id] || 0;
                if (total === 0) return null;
                
                const percentage = (total / grandTotal) * 100;
                
                return (
                  <div key={category.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm text-blue-800">{category.name}</span>
                    </div>
                    <div className="text-sm font-medium text-blue-800">
                      {formatNumber(total)} <CurrencyDisplay showSymbol={true} />
                      <span className="text-xs ml-1">({formatNumber(percentage)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="mt-auto">
          <ExportButton 
            categories={categories} 
            settings={settings} 
            notes={notes}
            project={project}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}