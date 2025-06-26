import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { BudgetLine, BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { formatNumber } from '../../utils/formatNumber';
import { useExpenseCategoriesStore } from '../../stores/expenseCategoriesStore';
import { calculateLineTotal } from '../../utils/budgetCalculations/base';
import { calculateSocialCharges } from '../../utils/budgetCalculations/base';
import { QuickInputCell } from './QuickInputCell';
import { CurrencyDisplay } from './CurrencyDisplay';

interface SubCategorySocialChargesProps {
  subCategory: BudgetLine;
  settings: QuoteSettings;
  workBudget?: BudgetCategory[];
  level: number;
  onUpdateItem: (updates: Partial<BudgetLine>) => void;
  quoteId: string;
}

export function SubCategorySocialCharges({
  subCategory,
  settings,
  workBudget,
  level,
  onUpdateItem,
  quoteId
}: SubCategorySocialChargesProps) {
  const { getCategories, showExpenseDistribution } = useExpenseCategoriesStore();
  const expenseCategories = getCategories(quoteId);
  
  // Obtenir les labels des taux personnalisés
  const rate1Label = settings.rateLabels?.rate1Label || 'TX 1';
  const rate2Label = settings.rateLabels?.rate2Label || 'TX 2';
  
  // Calculate initial budget social charges
  const totalInitialCharges = React.useMemo(() => {
    // Find the original subcategory in the initial budget
    const findInitialSubCategory = (workBudget: BudgetCategory[] | undefined, subCategoryId: string): BudgetLine | undefined => {
      if (!workBudget) return undefined;
      
      const findInItems = (items: BudgetLine[]): BudgetLine | undefined => {
        for (const item of items) {
          if (item.id === subCategoryId) return item;
          if (item.subItems) {
            const found = findInItems(item.subItems);
            if (found) return found;
          }
        }
        return undefined;
      };
      
      for (const category of workBudget) {
        const found = findInItems(category.items);
        if (found) return found;
      }
      return undefined;
    };


    const initialSubCategory = workBudget
      ? findInitialSubCategory(workBudget, subCategory.id) || subCategory
      : subCategory;

    return (
      initialSubCategory.subItems?.reduce((total, item) => {
        if (!item.socialCharges || item.includeSocialChargesInDistribution) {
          return total;
        }
        return total + calculateSocialCharges(item, settings);
      }, 0) || 0
    );
  }, [subCategory, workBudget, settings]);

  // Calculate work budget social charges
  const totalWorkCharges = React.useMemo(() => {
    // Calculate charges based on the current subCategory (work budget)
    return subCategory.subItems?.reduce((total, item) => {
      if (!item.socialCharges || item.includeSocialChargesInDistribution) {
        return total;
      }
      return total + calculateSocialCharges(item, settings, true);
    }, 0) || 0;
  }, [subCategory, settings]);

  // Calculate the difference between initial and work charges
  const chargesDifference = totalWorkCharges - totalInitialCharges;
  const chargesDifferencePercent = totalInitialCharges !== 0 ? (chargesDifference / totalInitialCharges) * 100 : 0;

  // Calculate distributed social charges by category - using ONLY work budget data
  const calculateDistributedCharges = (categoryId: string): number => {
    if (!subCategory.subItems) return 0;

    return subCategory.subItems.reduce((total, item) => {
      if (!item.socialCharges || !item.includeSocialChargesInDistribution) {
        return total;
      }

      const distribution = item.distributions?.find(d => d.id === categoryId);
      if (!distribution) {
        return total;
      }

      const baseTotal = calculateLineTotal(item, settings, false);
      const rate = settings.socialChargeRates.find(r => r.id === item.socialCharges);
      if (!rate) return total;

      const socialCharges = calculateSocialCharges(item, settings, false);

      return total + (
        distribution.type === 'fixed'
          ? (socialCharges * distribution.amount) / baseTotal
          : socialCharges * (distribution.amount / 100)
      );
    }, 0);
  };

  const indentation = (level + 1) * 12;

  // Vérifier si au moins un item a des charges sociales dans le budget initial
  const hasItemsWithCharges = subCategory.subItems?.some(item => item.socialCharges) || false;

  // Ne pas afficher la ligne si aucun item n'a de charges sociales dans le budget initial
  if (!hasItemsWithCharges) {
    return null;
  }

  if (totalInitialCharges === 0 && totalWorkCharges === 0 && !settings.showEmptyItems) return null;

  // Function to get difference color
  const getDifferenceColor = (difference: number): string => {
    if (difference > 0) return 'text-red-600';
    if (difference < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  // Only show the difference column in the work tab
  const isWorkTab = workBudget !== undefined;

  return (
    <tr className="group border-b hover:bg-gray-50/80 h-6">
      <td className="w-6 px-1"></td>
      <td className="px-1 py-0.5 sticky left-0 bg-white" style={{ paddingLeft: `${indentation + 8}px` }}>
        <span className="text-[11px] text-gray-600">Charges sociales</span>
      </td>
      <td colSpan={4} className={`text-right px-1 py-0.5  ${isWorkTab ? 'bg-gray-50' : ''}`}></td>
      <td className={`text-right px-1 py-0.5  ${isWorkTab ? 'bg-gray-50' : ''}`}>
        <span className={`text-[11px] ${isWorkTab ? 'text-gray-400' : 'text-gray-600'}`}>
          {formatNumber(totalInitialCharges)}
        </span>
      </td>
      <td colSpan={4}></td>
      <td className="text-right px-1 py-0.5">
        <span className={`text-[11px] text-gray-600 ${isWorkTab ? '' : 'hidden'}`}>
          {formatNumber(totalWorkCharges)}
        </span>
      </td>
      <td className="text-center px-1 py-0.5"></td>
      <td className="text-center px-1 py-0.5"></td>
      <td className="text-center px-1 py-0.5 border-r"></td>
      {/* Only show difference column in work tab */}
      {isWorkTab && (
        <>
          <td className="text-right px-1 py-0.5 whitespace-nowrap border-l">
            <div className="flex items-center justify-end gap-1">
              {chargesDifference > 0 ? <ArrowUpRight size={14} className="text-red-600" /> : 
               chargesDifference < 0 ? <ArrowDownRight size={14} className="text-green-600" /> : 
               <Minus size={14} className="text-gray-400" />}
              <span className={`text-[11px] ${chargesDifference > 0 ? 'text-red-600' : chargesDifference < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                {chargesDifference !== 0 && (
                  <>
                    {chargesDifference > 0 ? '+' : ''}{formatNumber(chargesDifference)} €
                    <span className="text-[10px] ml-0.5">({formatNumber(chargesDifferencePercent)}%)</span>
                  </>
                )}
              </span>
            </div>
          </td>
          <td className="px-2 py-1"></td>
        </>
      )}
      {showExpenseDistribution && expenseCategories.map(category => {
        const distributedCharges = calculateDistributedCharges(category.id);
        return (
          <td 
            key={category.id} 
            className="text-right px-1 py-0.5 text-[11px]"
            style={{ borderLeft: `2px solid ${category.color}` }}
          >
            {distributedCharges > 0 && (
              <>
                {formatNumber(distributedCharges)}
              </>
            )}
          </td>
        );
      })}
    </tr>
  );
}