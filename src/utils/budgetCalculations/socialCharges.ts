import { BudgetLine, BudgetCategory } from '../../types/budget';
import { QuoteSettings } from '../../types/quoteSettings';
import { calculateLineTotal } from './base';

// Calcul des charges sociales pour une ligne
export function calculateSocialCharges(line: BudgetLine, settings: QuoteSettings, useWorkCost: boolean = false): number {
  if (!line.socialCharges) return 0;
  
  // Use custom rate if provided
  if (typeof line.socialChargeRate === 'number' && !isNaN(line.socialChargeRate)) {
    const baseTotal = (line.quantity || 0) * (line.number || 0) * (line.rate || 0);
    const overtimeTotal = line.overtime || 0;
    const totalBeforeCharges = baseTotal + overtimeTotal;
    return totalBeforeCharges * line.socialChargeRate;
  }
  
  const rate = settings.socialChargeRates.find(r => r.id === line.socialCharges);
  if (!rate) return 0;
  
  // Calculate base amount including overtime
  const baseRate = useWorkCost && line.cost !== undefined ? line.cost : line.rate;
  const baseTotal = (line.quantity || 0) * (line.number || 0) * (baseRate || 0);
  const overtimeTotal = line.overtime || 0;
  const totalBeforeCharges = baseTotal + overtimeTotal;

  // Apply social charges rate
  return totalBeforeCharges * rate.rate;
}

// Calcul des charges sociales par type pour l'ensemble du budget
export function calculateSocialChargesByType(
  categories: BudgetCategory[],
  settings: QuoteSettings,
  useWorkCost: boolean = false
): Record<string, number> {
  const chargesByType: Record<string, number> = {};

  const processLine = (line: BudgetLine) => {
    if (line.subItems && line.subItems.length > 0) {
      line.subItems.forEach(processLine);
      return;
    }

    if (line.socialCharges) {
      const rate = settings.socialChargeRates.find(r => r.id === line.socialCharges);
      
      if (rate) {
        const charges = calculateSocialCharges(line, settings, useWorkCost);
        // En mode groupé, inclure toutes les charges sociales
        // En mode détaillé, inclure uniquement les charges non réparties
        if (settings.socialChargesDisplay === 'grouped' || !line.includeSocialChargesInDistribution) {
          chargesByType[line.socialCharges] = (chargesByType[line.socialCharges] || 0) + charges;
        }
      }
    }
  };

  categories.forEach(category => {
    if (category.id !== 'social-charges') {
      category.items.forEach(processLine);
    }
  });

  return chargesByType;
}

// Calcul des charges sociales pour une sous-catégorie
export function calculateSubCategorySocialCharges(
  subCategory: BudgetLine,
  settings: QuoteSettings,
  useWorkCost: boolean = false
): number {
  let total = 0;

  const processItem = (item: BudgetLine) => {
    if (item.socialCharges && !item.includeSocialChargesInDistribution) {
      const baseTotal = calculateLineTotal(item, settings, false, useWorkCost);
      const rate = settings.socialChargeRates.find(r => r.id === item.socialCharges);
      
      if (rate && baseTotal > 0) {
        total += baseTotal * rate.rate;
      }
    }

    if (item.subItems) {
      item.subItems.forEach(processItem);
    }
  };

  if (subCategory.subItems) {
    subCategory.subItems.forEach(processItem);
  }

  return total;
}

// Calcul des charges sociales pour une ligne avec répartition
export function calculateDistributedSocialCharges(
  line: BudgetLine,
  settings: QuoteSettings,
  distributionRatio: number
): number {
  if (!line.socialCharges || !line.includeSocialChargesInDistribution) return 0;

  const charges = calculateSocialCharges(line, settings);
  return charges * distributionRatio;
}

// Calcul des charges sociales pour une catégorie de dépense
export function calculateExpenseCategorySocialCharges(
  categories: BudgetCategory[],
  expenseCategoryId: string,
  settings: QuoteSettings
): number {
  let totalCharges = 0;

  const processLine = (line: BudgetLine) => {
    // Ne calculer les charges que si la ligne a des charges sociales ET qu'elles sont incluses dans la répartition
    if (!line.socialCharges || !line.includeSocialChargesInDistribution) return;

    const distribution = line.distributions?.find(d => d.id === expenseCategoryId);
    if (!distribution) return;

    const baseTotal = calculateLineTotal(line, settings, false);
    const rate = settings.socialChargeRates.find(r => r.id === line.socialCharges);
    
    if (!rate || baseTotal <= 0) return;
    
    const charges = baseTotal * rate.rate;

    // Calculer le ratio de distribution
    const ratio = distribution.type === 'fixed'
      ? distribution.amount / baseTotal
      : distribution.amount / 100;

    totalCharges += charges * ratio;

    // Traiter les sous-items
    if (line.subItems) {
      line.subItems.forEach(processLine);
    }
  };

  categories.forEach(category => {
    if (category.id !== 'social-charges') {
      category.items.forEach(processLine);
    }
  });

  return totalCharges;
}