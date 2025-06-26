import React from 'react';
import { ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { BudgetLine, BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { formatNumber } from '../../utils/formatNumber';
import { calculateSocialChargesByType, calculateSubCategorySocialCharges } from '../../utils/budgetCalculations/socialCharges';
import { calculateSocialCharges } from '../../utils/budgetCalculations/base';
import { useExpenseCategoriesStore } from '../../stores/expenseCategoriesStore';
import { QuickInputCell } from './QuickInputCell';
import { formatItemNumber } from '../../utils/formatItemNumber';
import { CurrencyDisplay } from './CurrencyDisplay';

interface SocialChargesCategoryProps {
  budget: BudgetCategory[];
  settings: QuoteSettings;
  categoryIndex: number;
  isExpanded: boolean;
  workBudget: BudgetCategory[];
  onUpdateSocialCharges: (rateId: string, updates: { agencyPercent?: number; marginPercent?: number }) => void;
  onToggleExpand: () => void;
  quoteId: string;
}

export function SocialChargesCategory({
  budget,
  settings,
  categoryIndex,
  isExpanded,
  workBudget,
  onToggleExpand,
  onUpdateSocialCharges,
  quoteId
}: SocialChargesCategoryProps) {
  const { getCategories, showExpenseDistribution } = useExpenseCategoriesStore();
  const expenseCategories = getCategories(quoteId);
  
  // Calculate base social charges for initial budget
  const initialChargesByType = calculateSocialChargesByType(budget, settings);

  // Calculate social charges for work budget
  const workChargesByType = calculateSocialChargesByType(workBudget, settings, true);

  // Calculate distributed social charges by type and category
  const distributedChargesByTypeAndCategory: Record<string, Record<string, number>> = {};
  
  const calculateDistributedCharges = () => {
    budget.forEach(category => {
      const processItem = (item: BudgetLine) => {
        if (item.socialCharges && item.includeSocialChargesInDistribution && item.distributions) {
          const baseTotal = item.quantity * item.number * item.rate;
          const rate = settings.socialChargeRates.find(r => r.id === item.socialCharges);
          
          if (rate && baseTotal > 0) {
            const charges = baseTotal * rate.rate;
            
            // Initialize object for this charge type if needed
            if (!distributedChargesByTypeAndCategory[item.socialCharges]) {
              distributedChargesByTypeAndCategory[item.socialCharges] = {};
            }
            
            // Distribute charges according to distributions
            item.distributions.forEach(distribution => {
              let distributionAmount: number;
              
              if (distribution.type === 'fixed') {
                const ratio = distribution.amount / baseTotal;
                distributionAmount = charges * ratio;
              } else {
                distributionAmount = charges * (distribution.amount / 100);
              }
              
              distributedChargesByTypeAndCategory[item.socialCharges][distribution.id] = 
                (distributedChargesByTypeAndCategory[item.socialCharges][distribution.id] || 0) + 
                distributionAmount;
            });
          }
        }

        if (item.subItems) {
          item.subItems.forEach(processItem);
        }
      };

      category.items.forEach(processItem);
    });
  };

  calculateDistributedCharges();

  // Obtenir les labels des taux personnalisés
  const rate1Label = settings.rateLabels?.rate1Label || 'TX 1';
  const rate2Label = settings.rateLabels?.rate2Label || 'TX 2';

  // Calculate totals including margins
  const calculateTotalWithMargins = (baseAmount: number, agencyPercent: number, marginPercent: number) => {
    const agencyAmount = baseAmount * (agencyPercent / 100);
    const marginAmount = baseAmount * (marginPercent / 100);
    
    // Return the total with margins
    return baseAmount + agencyAmount + marginAmount;
  };

  // Calculate total initial charges (including distributed charges)
  const totalInitialCharges = Object.entries(initialChargesByType).reduce((total, [rateId, amount]) => {
    const rate = settings.socialChargeRates.find(r => r.id === rateId);
    if (!rate) return total;
    
    // Use the specific rate's agency and margin percentages
    const agencyPercent = rate.agencyPercent !== undefined ? rate.agencyPercent : settings.defaultAgencyPercent;
    const marginPercent = rate.marginPercent !== undefined ? rate.marginPercent : settings.defaultMarginPercent;
    
    return total + calculateTotalWithMargins(
      amount,
      agencyPercent,
      marginPercent
    );
  }, 0);

  const totalDistributedCharges = Object.entries(distributedChargesByTypeAndCategory)
    .reduce((total, [rateId, categoryCharges]) => {
      const rate = settings.socialChargeRates.find(r => r.id === rateId);
      if (!rate) return total;
      
      const categoryTotal = Object.values(categoryCharges).reduce((sum, amount) => sum + amount, 0);
      
      // Use the specific rate's agency and margin percentages
      const agencyPercent = rate.agencyPercent !== undefined ? rate.agencyPercent : settings.defaultAgencyPercent;
      const marginPercent = rate.marginPercent !== undefined ? rate.marginPercent : settings.defaultMarginPercent;
      
      return total + calculateTotalWithMargins(
        categoryTotal,
        agencyPercent,
        marginPercent
      );
    }, 0);

  // Calculate total work charges
  const totalWorkCharges = Object.entries(workChargesByType).reduce((total, [rateId, amount]) => {
    const rate = settings.socialChargeRates.find(r => r.id === rateId);
    if (!rate) return total;
    
    // Use the specific rate's agency and margin percentages
    const agencyPercent = rate.agencyPercent !== undefined ? rate.agencyPercent : settings.defaultAgencyPercent;
    const marginPercent = rate.marginPercent !== undefined ? rate.marginPercent : settings.defaultMarginPercent;
    
    return total + calculateTotalWithMargins(
      amount,
      agencyPercent,
      marginPercent
    );
  }, 0);

  // Calculate the difference between initial and work charges
  const chargesDifference = totalWorkCharges - (totalInitialCharges + totalDistributedCharges);
  const chargesDifferencePercent = (totalInitialCharges + totalDistributedCharges) !== 0 
    ? (chargesDifference / (totalInitialCharges + totalDistributedCharges)) * 100 
    : 0;

  // Function to get difference color
  const getDifferenceColor = (difference: number): string => {
    if (difference > 0) return 'text-red-600';
    if (difference < 0) return 'text-green-600';
    return 'text-gray-600';
  };

  // Function to get difference icon
  const getDifferenceIcon = (difference: number) => {
    if (difference > 0) return <ArrowUpRight size={14} className="text-red-600" />;
    if (difference < 0) return <ArrowDownRight size={14} className="text-green-600" />;
    return <Minus size={14} className="text-gray-400" />;
  };

  // Only show if we're in grouped mode
  if (settings.socialChargesDisplay !== 'grouped') {
    return null;
  }
  
  // Format category number based on settings
  const categoryNumber = settings.numbering 
    ? formatItemNumber(
        [categoryIndex + 1],
        [settings.numbering.category],
        settings.numbering.separator
      )
    : (categoryIndex + 1).toString();

  return (
    <>
      <tr className="group bg-blue-800 h-8 border-b border-blue-700 w-full">
        <td className="w-6 px-1">
          <button 
            onClick={onToggleExpand}
            className="p-0.5 hover:bg-blue-700 rounded transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} className="text-white" /> : <ChevronRight size={14} className="text-white" />}
          </button>
        </td>
        <td className="px-2 py-1 sticky left-0 bg-blue-800">
          <div className="flex items-center">
            <span className="text-[10px] text-gray-300 font-mono tracking-tighter mr-1.5">{categoryNumber}</span>
            <span className="text-xs font-bold uppercase tracking-wide text-white">
              Charges Sociales
            </span>
          </div>
        </td>
        
        <td colSpan={4} className="bg-blue-800"></td>
        <td className="text-right px-2 py-1 bg-gray-50">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
            {formatNumber(totalInitialCharges + totalDistributedCharges)}
          </span>
        </td>
        
        <td colSpan={4}></td>
        <td className="text-right px-2 py-1">
          <span className="text-xs font-bold uppercase tracking-wide text-white">
            {formatNumber(totalWorkCharges)}
          </span>
        </td>
        
        <td colSpan={3}></td>
        <td className="text-right px-2 py-0.5 whitespace-nowrap border-l">
          <div className="flex items-center justify-end gap-1">
            {getDifferenceIcon(chargesDifference)}
            <span className={`text-xs font-bold uppercase tracking-wide ${getDifferenceColor(chargesDifference)}`}>
              {chargesDifference !== 0 && (
                <>
                  {chargesDifference > 0 ? '+' : ''}{formatNumber(chargesDifference)} €
                  <span className="text-[10px] ml-0.5">({formatNumber(chargesDifferencePercent)}%)</span>
                </>
              )}
            </span>
          </div>
        </td>
        
        <td className="py-0.5"></td>
        {showExpenseDistribution && expenseCategories.map(category => {
          const totalForCategory = Object.values(distributedChargesByTypeAndCategory).reduce((total, charges) => {
            return total + (charges[category.id] || 0);
          }, 0);
          
          return (
            <td 
              key={category.id}
              className="text-right px-2 py-1 bg-blue-800"
              style={{ borderLeft: `2px solid ${category.color}` }}
            >
              {totalForCategory > 0 && (
                <span className="text-xs font-bold uppercase tracking-wide text-white">
                  {formatNumber(totalForCategory)}
                </span>
              )}
            </td>
          );
        })}
      </tr>

      {isExpanded && settings.socialChargeRates.map((rate, index) => {
        const initialAmount = initialChargesByType[rate.id] || 0;
        const distributedCharges = distributedChargesByTypeAndCategory[rate.id] || {};
        const totalDistributed = Object.values(distributedCharges).reduce((a, b) => a + b, 0);
        const initialTotal = initialAmount + totalDistributed;
        const workAmount = workChargesByType[rate.id] || 0;
        
        // Calculate the difference between initial and work charges for this rate
        const rateDifference = workAmount - initialTotal;
        const rateDifferencePercent = initialTotal !== 0 ? (rateDifference / initialTotal) * 100 : 0;
        
        // Calculate margins using the specific rate's percentages
        const agencyPercent = rate.agencyPercent !== undefined ? rate.agencyPercent : settings.defaultAgencyPercent;
        const marginPercent = rate.marginPercent !== undefined ? rate.marginPercent : settings.defaultMarginPercent;
        const agencyAmount = initialTotal * (agencyPercent / 100);
        const marginAmount = initialTotal * (marginPercent / 100);
        const totalAmount = initialTotal + agencyAmount + marginAmount;
        
        if (totalAmount === 0 && !settings.showEmptyItems) return null;

        return (
          <tr key={rate.id} className="group border-b hover:bg-gray-50/80 h-6">
            <td className="w-6 px-1"></td>
            <td className="px-2 py-0.5 pl-8 sticky left-0 bg-white">
              <div className="flex items-center">
                <span className="text-[11px]">{rate.label}</span>
              </div>
            </td>
            <td colSpan={4}></td>
            <td className="text-right px-1 py-0.5 bg-gray-50">
              <span className="text-[11px] text-gray-600">
                {formatNumber(initialTotal)}
              </span>
            </td>
            <td colSpan={4}></td>
            <td className="text-right px-1 py-0.5">
              <span className="text-[11px]">
                {formatNumber(workAmount)}
              </span>
            </td>
            <td className="text-center px-1 py-0.5"></td>
            <td className="text-center px-1 py-0.5"></td>
            <td className="text-center px-1 py-0.5 border-r"></td>
            <td className="text-right px-1 py-0.5 whitespace-nowrap border-l">
              <div className="flex items-center justify-end gap-1">
                {getDifferenceIcon(rateDifference)}
                <span className={`text-[11px] ${getDifferenceColor(rateDifference)}`}>
                  {rateDifference !== 0 && (
                    <>
                      {rateDifference > 0 ? '+' : ''}{formatNumber(rateDifference)} €
                      <span className="text-[10px] ml-0.5">({formatNumber(rateDifferencePercent)}%)</span>
                    </>
                  )}
                </span>
              </div>
            </td>
            <td></td>
            {showExpenseDistribution && expenseCategories.map(category => (
              <td 
                key={category.id} 
                className="text-right px-1 py-0.5 text-[11px]"
                style={{ borderLeft: `2px solid ${category.color}` }}
              >
                {distributedCharges[category.id] > 0 && (
                  <>
                    {formatNumber(distributedCharges[category.id])}
                  </>
                )}
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}